import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { PRODUCTS } from '../data/products';
import type {
  CustomerOrder,
  RetailerProcurementOrder,
} from '../types/firestore';

// Collection references
const COLLECTION_CUSTOMER_ORDERS = 'customerOrders';
const COLLECTION_PROCUREMENT_ORDERS = 'retailerProcurementOrders';
const COLLECTION_DEMAND_SIGNALS = 'demandSignals';
const COLLECTION_INVENTORY = 'inventory';

/**
 * Creates a Customer Order in Firestore atomically via transaction.
 * Rules:
 * - inventory_new = inventory_old - customer_quantity
 * - Never allow inventory to become negative
 * - Prevents duplicate customer order processing (idempotent)
 * - Atomic write: if any write fails, transaction rolls back completely
 */
export async function addCustomerOrderDoc(
  orderData: Omit<CustomerOrder, 'id'> & { id?: string }
): Promise<string> {
  const retailerId = orderData.retailerId || 'GUNTUR_STORE_01';
  const customOrderId = orderData.id || `ORDER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const orderRef = doc(db, COLLECTION_CUSTOMER_ORDERS, customOrderId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Idempotency Check: Prevent duplicate customer order processing
      const existingOrderSnap = await transaction.get(orderRef);
      if (existingOrderSnap.exists()) {
        console.warn(`Idempotent guard: Customer order ${customOrderId} already processed.`);
        return;
      }

      // 2. Read inventory documents for all ordered items atomically
      const invRefs = orderData.items.map((item) => {
        const invDocId = `${retailerId}_${item.productId}`;
        return {
          item,
          ref: doc(db, COLLECTION_INVENTORY, invDocId),
        };
      });

      const invSnaps = await Promise.all(
        invRefs.map((i) => transaction.get(i.ref))
      );

      // 3. Stock validation & calculation (inventory_new = inventory_old - customer_quantity)
      const invUpdates: { ref: any; newStock: number; retailerId: string; productId: string }[] = [];

      for (let idx = 0; idx < invRefs.length; idx++) {
        const { item, ref } = invRefs[idx];
        const snap = invSnaps[idx];

        const prod = PRODUCTS.find((p) => p.id === item.productId);
        const baseStock = prod ? prod.currentStock : 100;

        let currentStock = baseStock;
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.stock === 'number') {
            currentStock = data.stock;
          } else if (typeof data.quantityDelta === 'number') {
            currentStock = Math.max(0, baseStock + data.quantityDelta);
          }
        }

        // Never allow inventory to become negative
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.productName}". Available: ${currentStock}, requested: ${item.quantity}`
          );
        }

        const newStock = currentStock - item.quantity;
        invUpdates.push({
          ref,
          newStock,
          retailerId,
          productId: item.productId,
        });
      }

      // 4. Atomic writes: Create customer order, update inventory, & log demand signals
      transaction.set(orderRef, {
        ...orderData,
        id: customOrderId,
        createdAt: serverTimestamp(),
      });

      for (const update of invUpdates) {
        transaction.set(update.ref, {
          retailerId: update.retailerId,
          productId: update.productId,
          stock: update.newStock,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      for (const item of orderData.items) {
        const signalRef = doc(collection(db, COLLECTION_DEMAND_SIGNALS));
        transaction.set(signalRef, {
          retailerId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          source: 'customer_purchase',
          customerOrderId: customOrderId,
          timestamp: serverTimestamp(),
        });
      }
    });

    return customOrderId;
  } catch (err: any) {
    console.warn('Firestore transaction error for customer order:', err);
    throw err;
  }
}

/**
 * Real-time listener for Customer Orders.
 */
export function subscribeCustomerOrders(callback: (orders: CustomerOrder[]) => void): () => void {
  try {
    const q = query(collection(db, COLLECTION_CUSTOMER_ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: CustomerOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            customerId: data.customerId || '',
            customerName: data.customerName || 'Customer',
            retailerId: data.retailerId || 'GUNTUR_STORE_01',
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'Confirmed',
            paymentMethod: data.paymentMethod || 'VyaPulse',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          };
        });
        callback(orders);
      },
      (err) => {
        console.warn('Firestore customerOrders listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Creates a Retailer Procurement Order (B2B Request to Supplier) in Firestore.
 */
export async function addProcurementOrderDoc(
  orderData: Omit<RetailerProcurementOrder, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_PROCUREMENT_ORDERS), {
      ...orderData,
      createdAt: serverTimestamp(),
      dispatchedAt: null,
      deliveredAt: null,
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore procurement order save fallback:', err);
    return `PO_${Date.now()}`;
  }
}

/**
 * Updates a Retailer Procurement Order status atomically via transaction.
 * Rules:
 * - State machine transitions enforced:
 *     Pending -> Accepted | Cancelled
 *     Accepted -> Dispatched | Cancelled
 *     Dispatched -> Delivered
 *     Delivered & Cancelled are terminal states
 * - Acceptance, cancellation, and dispatch leave inventory UNCHANGED
 * - Stock replenishment occurs ONLY when order transitions to 'Delivered', exactly once
 * - Atomic write: records status timestamp and replenishes inventory safely
 */
export async function updateProcurementOrderStatusDoc(
  orderId: string,
  newStatus: RetailerProcurementOrder['status'],
  retailerId: string = 'GUNTUR_STORE_01',
  items: RetailerProcurementOrder['items'] = [],
  cancellationReason?: string
): Promise<void> {
  const orderRef = doc(db, COLLECTION_PROCUREMENT_ORDERS, orderId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error(`Procurement order ${orderId} not found in database.`);
      }

      const currentData = orderSnap.data();
      const currentStatus = (currentData.status as RetailerProcurementOrder['status']) || 'Pending';

      // 1. Terminal state check
      if (currentStatus === 'Delivered') {
        throw new Error(`Order ${orderId} is already Delivered (terminal state). Cannot modify.`);
      }
      if (currentStatus === 'Cancelled') {
        throw new Error(`Order ${orderId} is already Cancelled (terminal state). Cannot modify.`);
      }

      // 2. Validate allowed transitions
      const validTransitions: Record<RetailerProcurementOrder['status'], RetailerProcurementOrder['status'][]> = {
        Pending: ['Accepted', 'Cancelled'],
        Accepted: ['Dispatched', 'Cancelled'],
        Dispatched: ['Delivered'],
        Delivered: [],
        Cancelled: [],
      };

      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Invalid state transition for order ${orderId}: cannot change from "${currentStatus}" to "${newStatus}".`
        );
      }

      // 3. Prepare update document with accurate timestamps
      const updates: any = { status: newStatus };
      if (newStatus === 'Accepted') updates.acceptedAt = serverTimestamp();
      if (newStatus === 'Dispatched') updates.dispatchedAt = serverTimestamp();
      if (newStatus === 'Delivered') updates.deliveredAt = serverTimestamp();
      if (newStatus === 'Cancelled') {
        updates.cancelledAt = serverTimestamp();
        if (cancellationReason) updates.cancellationReason = cancellationReason;
      }

      // 4. Physical inventory replenishment ONLY on transition to 'Delivered'
      if (newStatus === 'Delivered') {
        const targetItems = currentData.items || items;
        const targetRetailerId = currentData.retailerId || retailerId;

        const invRefs = targetItems.map((item: any) => {
          const invDocId = `${targetRetailerId}_${item.productId}`;
          return {
            item,
            ref: doc(db, COLLECTION_INVENTORY, invDocId),
          };
        });

        const invSnaps = await Promise.all(invRefs.map((i: any) => transaction.get(i.ref)));
        const invUpdates: { ref: any; newStock: number; retailerId: string; productId: string }[] = [];

        for (let idx = 0; idx < invRefs.length; idx++) {
          const { item, ref } = invRefs[idx];
          const snap = invSnaps[idx];

          const prod = PRODUCTS.find((p) => p.id === item.productId);
          const baseStock = prod ? prod.currentStock : 100;

          let currentStock = baseStock;
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data.stock === 'number') {
              currentStock = data.stock;
            } else if (typeof data.quantityDelta === 'number') {
              currentStock = Math.max(0, baseStock + data.quantityDelta);
            }
          }

          const newStock = currentStock + item.quantity;
          invUpdates.push({
            ref,
            newStock,
            retailerId: targetRetailerId,
            productId: item.productId,
          });
        }

        for (const update of invUpdates) {
          transaction.set(
            update.ref,
            {
              retailerId: update.retailerId,
              productId: update.productId,
              stock: update.newStock,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      transaction.update(orderRef, updates);
    });
  } catch (err) {
    console.warn('Firestore transaction error for procurement update:', err);
    throw err;
  }
}

/**
 * Real-time listener for Retailer Procurement Orders.
 */
export function subscribeProcurementOrders(
  callback: (orders: RetailerProcurementOrder[]) => void
): () => void {
  try {
    const q = query(collection(db, COLLECTION_PROCUREMENT_ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: RetailerProcurementOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            retailerId: data.retailerId || 'GUNTUR_STORE_01',
            retailerName: data.retailerName || 'My Store - Guntur, AP',
            supplierId: data.supplierId || 'GUNTUR_SUPPLIER_HUB',
            supplierName: data.supplierName || 'Guntur Spice Traders & Exporters',
            items: data.items || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || 'Pending',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
            acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate().toLocaleDateString('en-IN') : null,
            dispatchedAt: data.dispatchedAt?.toDate ? data.dispatchedAt.toDate().toLocaleDateString('en-IN') : null,
            deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate().toLocaleDateString('en-IN') : null,
            cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toLocaleDateString('en-IN') : null,
            cancellationReason: data.cancellationReason || null,
          };
        });
        callback(orders);
      },
      (err) => {
        console.warn('Firestore procurementOrders listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Real-time listener for Inventory stock levels.
 */
export function subscribeInventory(
  callback: (inventoryMap: Record<string, number>) => void
): () => void {
  try {
    const q = query(collection(db, COLLECTION_INVENTORY));
    return onSnapshot(
      q,
      (snapshot) => {
        const invMap: Record<string, number> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.productId && typeof data.stock === 'number') {
            const prod = PRODUCTS.find((p) => p.id === data.productId);
            const baseStock = prod ? prod.currentStock : 100;
            invMap[data.productId] = data.stock - baseStock;
          } else if (data.productId && typeof data.quantityDelta === 'number') {
            invMap[data.productId] = data.quantityDelta;
          }
        });
        callback(invMap);
      },
      (err) => {
        console.warn('Firestore inventory listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

export interface DemandSignalDoc {
  id?: string;
  retailerId: string;
  productId: string;
  productName: string;
  quantity: number;
  source: string;
  customerOrderId?: string;
  timestamp?: any;
}

/**
 * Fetches historical demand signals for a specific retailer and product.
 */
export async function fetchDemandSignalsDoc(
  retailerId: string,
  productId: string
): Promise<DemandSignalDoc[]> {
  try {
    const q = query(
      collection(db, COLLECTION_DEMAND_SIGNALS),
      where('retailerId', '==', retailerId),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as DemandSignalDoc[];
  } catch (err) {
    console.warn('Firestore demandSignals query fallback:', err);
    return [];
  }
}

/**
 * Fetches Customer Orders from Firestore.
 */
export async function fetchCustomerOrdersDoc(retailerId?: string): Promise<CustomerOrder[]> {
  try {
    const q = retailerId
      ? query(collection(db, COLLECTION_CUSTOMER_ORDERS), where('retailerId', '==', retailerId))
      : query(collection(db, COLLECTION_CUSTOMER_ORDERS));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as CustomerOrder[];
  } catch (err) {
    console.warn('Firestore customer orders query fallback:', err);
    return [];
  }
}

/**
 * Fetches Retailer Procurement Orders from Firestore.
 */
export async function fetchProcurementOrdersDoc(
  retailerId?: string,
  supplierId?: string
): Promise<RetailerProcurementOrder[]> {
  try {
    let q;
    if (supplierId) {
      q = query(collection(db, COLLECTION_PROCUREMENT_ORDERS), where('supplierId', '==', supplierId));
    } else if (retailerId) {
      q = query(collection(db, COLLECTION_PROCUREMENT_ORDERS), where('retailerId', '==', retailerId));
    } else {
      q = query(collection(db, COLLECTION_PROCUREMENT_ORDERS));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as RetailerProcurementOrder[];
  } catch (err) {
    console.warn('Firestore procurement orders query fallback:', err);
    return [];
  }
}

/**
 * Reads live stock level for a retailer & product directly from Firestore.
 */
export async function getRetailerStockFromFirestore(
  retailerId: string,
  productId: string,
  defaultStock: number = 100
): Promise<number> {
  try {
    const invDocId = `${retailerId}_${productId}`;
    const snapshot = await getDocs(query(collection(db, COLLECTION_INVENTORY), where('productId', '==', productId)));
    for (const docSnap of snapshot.docs) {
      if (docSnap.id === invDocId || docSnap.data().productId === productId) {
        const data = docSnap.data();
        if (typeof data.stock === 'number') return data.stock;
        if (typeof data.quantityDelta === 'number') return Math.max(0, defaultStock + data.quantityDelta);
      }
    }
    return defaultStock;
  } catch {
    return defaultStock;
  }
}

