import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  CustomerOrder,
  RetailerProcurementOrder,
  RetailerProcurementItem,
} from '../types/firestore';
import {
  addCustomerOrderDoc,
  subscribeCustomerOrders,
  addProcurementOrderDoc,
  subscribeProcurementOrders,
  updateProcurementOrderStatusDoc,
  subscribeInventory,
} from '../services/firestoreService';
import { subscribeToSupabaseOrders } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

function normalizeStatus(s: string): RetailerProcurementOrder['status'] {
  const upper = (s || '').toUpperCase();
  if (upper === 'SUBMITTED' || upper === 'PENDING') return 'Pending';
  if (upper === 'ACCEPTED' || upper === 'PACKED') return 'Accepted';
  if (upper === 'DISPATCHED') return 'Dispatched';
  if (upper === 'DELIVERED') return 'Delivered';
  if (upper === 'CANCELLED' || upper === 'REJECTED') return 'Cancelled';
  return 'Pending';
}

interface SupplyChainContextType {
  customerOrders: CustomerOrder[];
  procurementOrders: RetailerProcurementOrder[];
  inventoryOverrides: Record<string, number>;

  // Customer order workflow
  addCustomerOrder: (orderData: Omit<CustomerOrder, 'id'>) => Promise<string>;

  // Retailer procurement workflow
  createRetailerStockOrder: (
    items: RetailerProcurementItem[],
    supplierId?: string,
    supplierName?: string,
    retailerId?: string,
    retailerName?: string
  ) => Promise<string>;

  // Supplier & Retailer status transition actions
  acceptSupplierOrder: (orderId: string) => Promise<void>;
  cancelSupplierOrder: (orderId: string, reason?: string) => Promise<void>;
  dispatchSupplierOrder: (orderId: string) => Promise<void>;
  deliverSupplierOrder: (orderId: string) => Promise<void>;
  fulfillSupplierOrder: (orderId: string) => Promise<void>;

  // Inventory helpers
  updateInventory: (productId: string, deltaQuantity: number) => void;
  getRetailerInventory: (productId: string, baseStock: number) => number;

  // Filtered queries
  getCustomerOrders: (retailerId?: string) => CustomerOrder[];
  getRetailerProcurementOrders: (retailerId?: string) => RetailerProcurementOrder[];
  getSupplierBuyerRequests: (supplierId?: string) => RetailerProcurementOrder[];
}

const INITIAL_CUSTOMER_ORDERS: CustomerOrder[] = [
  {
    id: 'DX-10420',
    customerId: 'cust_01',
    customerName: 'Durga Prasad',
    retailerId: 'GUNTUR_STORE_01',
    items: [
      { productId: 'sona-masoori-rice', productName: 'Babu Super Sona Masoori Rice (5kg)', quantity: 2, unit: '5kg bag', price: 320 },
      { productId: 'sugar', productName: 'Madhur Pure Crystal Sugar (5kg)', quantity: 1, unit: '5kg bag', price: 230 },
    ],
    totalAmount: 870,
    status: 'Completed',
    paymentMethod: 'VyaPulse',
    createdAt: '10 Sep 2026',
  },
  {
    id: 'DX-10418',
    customerId: 'cust_02',
    customerName: 'Srinivas Rao',
    retailerId: 'GUNTUR_STORE_01',
    items: [
      { productId: 'basmati-rice', productName: 'India Gate Royal Basmati Rice (5kg)', quantity: 2, unit: '5kg bag', price: 510 },
      { productId: 'cooking-oil', productName: 'Fortune Sunlite Sunflower Oil (1L)', quantity: 3, unit: '1L pouch', price: 135 },
    ],
    totalAmount: 1425,
    status: 'Completed',
    paymentMethod: 'UPI',
    createdAt: '08 Sep 2026',
  },
];

const INITIAL_PROCUREMENT_ORDERS: RetailerProcurementOrder[] = [
  {
    id: 'PO-9401',
    retailerId: 'GUNTUR_STORE_01',
    retailerName: 'My Store - Guntur, AP',
    supplierId: 'GUNTUR_SUPPLIER_HUB',
    supplierName: 'Guntur Spice Traders & Exporters',
    items: [
      { productId: 'sona-masoori-rice', productName: 'Babu Super Sona Masoori Rice (5kg)', quantity: 50, unit: '5kg bag', price: 290 },
      { productId: 'chana-dal', productName: 'Tata Sampann High-Protein Chana Dal (1kg)', quantity: 100, unit: '1kg pack', price: 88 },
    ],
    totalAmount: 23300,
    status: 'Pending',
    createdAt: '12 Sep 2026',
    isDemo: true,
  },
  {
    id: 'PO-9402',
    retailerId: 'GUNTUR_STORE_01',
    retailerName: 'My Store - Guntur, AP',
    supplierId: 'GUNTUR_SUPPLIER_HUB',
    supplierName: 'Guntur Spice Traders & Exporters',
    items: [
      { productId: 'sugar', productName: 'Madhur Pure Crystal Sugar (5kg)', quantity: 40, unit: '5kg bag', price: 210 },
      { productId: 'red-chilli', productName: 'Guntur Supreme Dried Red Chilli (1kg)', quantity: 60, unit: '1kg pack', price: 125 },
    ],
    totalAmount: 15900,
    status: 'Accepted',
    createdAt: '11 Sep 2026',
    acceptedAt: '11 Sep 2026',
    isDemo: true,
  },
  {
    id: 'PO-9403',
    retailerId: 'GUNTUR_STORE_01',
    retailerName: 'My Store - Guntur, AP',
    supplierId: 'GUNTUR_SUPPLIER_HUB',
    supplierName: 'Guntur Spice Traders & Exporters',
    items: [
      { productId: 'toor-dal', productName: 'Tata Sampann Unpolished Toor Dal (1kg)', quantity: 80, unit: '1kg pack', price: 148 },
      { productId: 'cooking-oil', productName: 'Fortune Sunlite Sunflower Oil (1L)', quantity: 120, unit: '1L pouch', price: 122 },
    ],
    totalAmount: 26480,
    status: 'Dispatched',
    createdAt: '09 Sep 2026',
    acceptedAt: '09 Sep 2026',
    dispatchedAt: '10 Sep 2026',
    isDemo: true,
  },
  {
    id: 'PO-9404',
    retailerId: 'GUNTUR_STORE_01',
    retailerName: 'My Store - Guntur, AP',
    supplierId: 'ANDHRA_OIL_MILLS',
    supplierName: 'Andhra Oil & Grains Wholesale Hub',
    items: [
      { productId: 'cooking-oil', productName: 'Fortune Sunlite Sunflower Oil (1L)', quantity: 200, unit: '1L pouch', price: 120 },
    ],
    totalAmount: 24000,
    status: 'Delivered',
    createdAt: '05 Sep 2026',
    acceptedAt: '05 Sep 2026',
    dispatchedAt: '06 Sep 2026',
    deliveredAt: '07 Sep 2026',
    isDemo: true,
  },
  {
    id: 'PO-9405',
    retailerId: 'GUNTUR_STORE_01',
    retailerName: 'My Store - Guntur, AP',
    supplierId: 'VIJAYAWADA_FARMERS_HUB',
    supplierName: 'Vijayawada Farmers Producer Co.',
    items: [
      { productId: 'moong-dal', productName: 'Tata Sampann Yellow Moong Dal (1kg)', quantity: 50, unit: '1kg pack', price: 120 },
    ],
    totalAmount: 6000,
    status: 'Cancelled',
    createdAt: '08 Sep 2026',
    cancelledAt: '08 Sep 2026',
    cancellationReason: 'Supplier stock allocation exhausted for this batch.',
    isDemo: true,
  },
];

const SupplyChainContext = createContext<SupplyChainContextType | undefined>(undefined);

export const SupplyChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem('demandx_sc_customer_orders_v2');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_ORDERS;
    } catch {
      return INITIAL_CUSTOMER_ORDERS;
    }
  });

  const [procurementOrders, setProcurementOrders] = useState<RetailerProcurementOrder[]>(() => {
    try {
      const saved = localStorage.getItem('demandx_sc_procurement_orders_v2');
      return saved ? JSON.parse(saved) : INITIAL_PROCUREMENT_ORDERS;
    } catch {
      return INITIAL_PROCUREMENT_ORDERS;
    }
  });

  const [inventoryOverrides, setInventoryOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('demandx_inventory_overrides_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Subscribe to real-time Firestore customerOrders with unmount cleanup
  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = subscribeCustomerOrders((orders) => {
      if (isSubscribed && orders && orders.length > 0) {
        setCustomerOrders(orders);
      }
    });
    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to real-time Firestore procurementOrders with unmount cleanup
  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = subscribeProcurementOrders((orders) => {
      if (isSubscribed && orders && orders.length > 0) {
        setProcurementOrders(orders);
      }
    });
    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch & Synchronize orders from DemandX Persistent Backend / Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchBackendOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders?role=admin`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.orders && data.orders.length > 0) {
            const mapped: RetailerProcurementOrder[] = data.orders.map((po: any) => ({
              id: po.id || po.order_id,
              retailerId: po.store_id || 'GUNTUR_STORE_01',
              retailerName: po.store_id === 'GUNTUR_STORE_01' ? 'My Store - Guntur, AP' : po.store_id,
              supplierId: po.supplier_id || 'GUNTUR_SUPPLIER_HUB',
              supplierName: po.supplier_id === 'SUP_GUNTUR_01' ? 'Guntur Spice Traders & Exporters' : (po.supplier_id === 'SUP_VIJAYAWADA_01' ? 'Krishna Basin Wholesale Logistics' : po.supplier_id),
              items: (po.items || []).map((it: any) => ({
                productId: it.product_id,
                productName: it.product_name || it.name,
                quantity: it.quantity || it.qty || 1,
                unit: it.unit || 'pack',
                price: it.price || it.unit_price || 100,
              })),
              totalAmount: po.total_amount || po.totalAmount || po.total_inr || 0,
              status: normalizeStatus(po.status),
              createdAt: po.created_at || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              isDemo: po.isDemo !== undefined ? po.isDemo : false,
              cancellationReason: po.cancellation_reason || po.rejection_reason,
            }));
            setProcurementOrders(mapped);
          }
        }
      } catch (e) {
        // Quiet fallback to local/cached orders
      }
    };

    fetchBackendOrders();
    const interval = setInterval(fetchBackendOrders, 6000);

    // Supabase Realtime channel subscription if configured
    const unsubRealtime = subscribeToSupabaseOrders(() => {
      fetchBackendOrders();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubRealtime === 'function') unsubRealtime();
    };
  }, []);

  // Subscribe to real-time Firestore inventory stock changes
  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = subscribeInventory((invMap) => {
      if (isSubscribed && invMap) {
        setInventoryOverrides((prev) => ({
          ...prev,
          ...invMap,
        }));
      }
    });
    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('demandx_sc_customer_orders_v2', JSON.stringify(customerOrders));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [customerOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('demandx_sc_procurement_orders_v2', JSON.stringify(procurementOrders));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [procurementOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('demandx_inventory_overrides_v2', JSON.stringify(inventoryOverrides));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [inventoryOverrides]);

  // CUSTOMER ORDER WORKFLOW
  const addCustomerOrder = useCallback(
    async (orderData: Omit<CustomerOrder, 'id'>): Promise<string> => {
      let docId = `ORDER_${Date.now()}`;
      try {
        docId = await addCustomerOrderDoc(orderData);
      } catch (err: any) {
        if (err?.message?.includes('Insufficient stock')) {
          throw err;
        }
        console.warn('Firestore transaction fallback for customer order:', err);
      }

      const newOrder: CustomerOrder = {
        id: docId.startsWith('ORDER_') ? `#DX-${Math.floor(1000 + Math.random() * 9000)}` : docId,
        ...orderData,
        customerName: orderData.customerName || currentUser?.displayName || 'Durga Prasad',
        createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      setCustomerOrders((prev) => [newOrder, ...prev]);

      // Deduct retailer inventory
      setInventoryOverrides((prev) => {
        const copy = { ...prev };
        for (const item of orderData.items) {
          copy[item.productId] = (copy[item.productId] || 0) - item.quantity;
        }
        return copy;
      });

      return newOrder.id || docId;
    },
    [currentUser]
  );

  // RETAILER PROCUREMENT WORKFLOW
  const createRetailerStockOrder = useCallback(
    async (
      items: RetailerProcurementItem[],
      supplierId: string = 'GUNTUR_SUPPLIER_HUB',
      supplierName: string = 'Guntur Spice Traders & Exporters',
      retailerId: string = 'GUNTUR_STORE_01',
      retailerName: string = 'My Store - Guntur, AP'
    ): Promise<string> => {
      if (!items || items.length === 0) {
        throw new Error('Cannot create procurement order with empty items.');
      }

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Invalid quantity for ${item.productName}`);
        }
      }

      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const orderData: Omit<RetailerProcurementOrder, 'id'> = {
        retailerId,
        retailerName,
        supplierId,
        supplierName,
        items,
        totalAmount,
        status: 'Pending',
        createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        isDemo: false,
      };

      const docId = await addProcurementOrderDoc(orderData);
      const newPO: RetailerProcurementOrder = {
        id: docId.startsWith('PO_') ? `#PO-${Math.floor(1000 + Math.random() * 9000)}` : docId,
        ...orderData,
      };

      // Persist to FastAPI Backend & PostgreSQL / Supabase
      try {
        await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: retailerId,
            supplier_id: supplierId,
            supplier_name: supplierName,
            items: items.map((it) => ({
              product_id: it.productId,
              product_name: it.productName,
              quantity: it.quantity,
              unit: it.unit,
              unit_price: it.price,
            })),
          }),
        });
      } catch (err) {
        console.warn('Backend order persistence notice:', err);
      }

      setProcurementOrders((prev) => [newPO, ...prev]);
      return newPO.id || docId;
    },
    []
  );

  // 1. SUPPLIER ACCEPTS ORDER (Pending -> Accepted)
  // Stock unchanged!
  const acceptSupplierOrder = useCallback(
    async (orderId: string): Promise<void> => {
      const target = procurementOrders.find((p) => p.id === orderId);
      if (!target) throw new Error(`Order ${orderId} not found.`);
      if (target.status !== 'Pending') {
        throw new Error(`Cannot accept order with status "${target.status}". Must be Pending.`);
      }

      try {
        await updateProcurementOrderStatusDoc(orderId, 'Accepted', target.retailerId, target.items);
      } catch (err) {
        console.warn('Firestore accept error (falling back to local state):', err);
      }

      // Sync with DemandX Persistent Database
      const cleanId = orderId.replace(/^#/, '');
      try {
        await fetch(`${API_BASE}/api/orders/${cleanId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ACCEPTED',
            role: 'supplier',
            actor: 'Supplier Wholesale Rep',
          }),
        });
      } catch (err) {
        console.warn('Backend status transition error:', err);
      }

      const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      setProcurementOrders((prev) =>
        prev.map((po) =>
          po.id === orderId ? { ...po, status: 'Accepted', acceptedAt: nowStr } : po
        )
      );
    },
    [procurementOrders]
  );

  // 2. SUPPLIER CANCELS ORDER (Pending / Accepted -> Cancelled)
  // Stock unchanged!
  const cancelSupplierOrder = useCallback(
    async (orderId: string, reason?: string): Promise<void> => {
      const target = procurementOrders.find((p) => p.id === orderId);
      if (!target) throw new Error(`Order ${orderId} not found.`);
      if (target.status === 'Dispatched') {
        throw new Error(`Cannot cancel order ${orderId} after it has been dispatched.`);
      }
      if (target.status === 'Delivered') {
        throw new Error(`Cannot cancel order ${orderId} after it has been delivered.`);
      }
      if (target.status === 'Cancelled') {
        throw new Error(`Order ${orderId} is already cancelled.`);
      }

      const cancelReason = reason || 'Order cancelled by supplier due to supply availability.';
      try {
        await updateProcurementOrderStatusDoc(orderId, 'Cancelled', target.retailerId, target.items, cancelReason);
      } catch (err) {
        console.warn('Firestore cancel error (falling back to local state):', err);
      }

      // Sync with DemandX Persistent Database
      const cleanId = orderId.replace(/^#/, '');
      try {
        await fetch(`${API_BASE}/api/orders/${cleanId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'CANCELLED',
            role: 'supplier',
            actor: 'Supplier Wholesale Rep',
            reason: cancelReason,
          }),
        });
      } catch (err) {
        console.warn('Backend status transition error:', err);
      }

      const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      setProcurementOrders((prev) =>
        prev.map((po) =>
          po.id === orderId
            ? { ...po, status: 'Cancelled', cancelledAt: nowStr, cancellationReason: cancelReason }
            : po
        )
      );
    },
    [procurementOrders]
  );

  // 3. SUPPLIER DISPATCHES ORDER (Accepted -> Dispatched)
  // Stock unchanged! Stock increases only on Delivery.
  const dispatchSupplierOrder = useCallback(
    async (orderId: string): Promise<void> => {
      const target = procurementOrders.find((p) => p.id === orderId);
      if (!target) throw new Error(`Order ${orderId} not found.`);
      if (target.status !== 'Accepted') {
        throw new Error(`Cannot dispatch order ${orderId} directly. Order must be Accepted first.`);
      }

      try {
        await updateProcurementOrderStatusDoc(orderId, 'Dispatched', target.retailerId, target.items);
      } catch (err) {
        console.warn('Firestore dispatch error (falling back to local state):', err);
      }

      // Sync with DemandX Persistent Database
      const cleanId = orderId.replace(/^#/, '');
      try {
        await fetch(`${API_BASE}/api/orders/${cleanId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DISPATCHED',
            role: 'supplier',
            actor: 'Logistics Fleet Manager',
          }),
        });
      } catch (err) {
        console.warn('Backend status transition error:', err);
      }

      const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      setProcurementOrders((prev) =>
        prev.map((po) =>
          po.id === orderId ? { ...po, status: 'Dispatched', dispatchedAt: nowStr } : po
        )
      );
    },
    [procurementOrders]
  );

  // 4. ORDER DELIVERED / GOODS RECEIVED (Dispatched -> Delivered)
  // REPLENISHES RETAILER INVENTORY EXACTLY ONCE!
  const deliverSupplierOrder = useCallback(
    async (orderId: string): Promise<void> => {
      const target = procurementOrders.find((p) => p.id === orderId);
      if (!target) throw new Error(`Order ${orderId} not found.`);
      if (target.status !== 'Dispatched') {
        throw new Error(`Cannot mark delivered: Order ${orderId} must be in Dispatched state.`);
      }

      try {
        await updateProcurementOrderStatusDoc(orderId, 'Delivered', target.retailerId, target.items);
      } catch (err) {
        console.warn('Firestore deliver error (falling back to local state):', err);
      }

      // Sync with DemandX Persistent Database
      const cleanId = orderId.replace(/^#/, '');
      try {
        await fetch(`${API_BASE}/api/orders/${cleanId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DELIVERED',
            role: 'retailer',
            actor: 'Store Receiving Manager',
          }),
        });
      } catch (err) {
        console.warn('Backend status transition error:', err);
      }

      const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      setProcurementOrders((prev) =>
        prev.map((po) =>
          po.id === orderId ? { ...po, status: 'Delivered', deliveredAt: nowStr } : po
        )
      );

      // Autoritative replenishment of retailer physical stock upon goods receipt
      setInventoryOverrides((prev) => {
        const copy = { ...prev };
        for (const item of target.items) {
          copy[item.productId] = (copy[item.productId] || 0) + item.quantity;
        }
        return copy;
      });
    },
    [procurementOrders]
  );

  // Backwards-compatible supplier fulfill workflow (auto moves through Accepted -> Dispatched)
  const fulfillSupplierOrder = useCallback(
    async (orderId: string): Promise<void> => {
      const target = procurementOrders.find((p) => p.id === orderId);
      if (!target) return;

      if (target.status === 'Pending') {
        await acceptSupplierOrder(orderId);
      }
      await dispatchSupplierOrder(orderId);
    },
    [procurementOrders, acceptSupplierOrder, dispatchSupplierOrder]
  );

  // INVENTORY HELPERS
  const updateInventory = useCallback((productId: string, deltaQuantity: number) => {
    setInventoryOverrides((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + deltaQuantity,
    }));
  }, []);

  const getRetailerInventory = useCallback(
    (productId: string, baseStock: number): number => {
      const delta = inventoryOverrides[productId] || 0;
      return Math.max(0, baseStock + delta);
    },
    [inventoryOverrides]
  );

  // GETTER HELPERS FOR DASHBOARDS
  const getCustomerOrders = useCallback(
    (retailerId?: string): CustomerOrder[] => {
      if (!retailerId) return customerOrders;
      return customerOrders.filter((o) => o.retailerId === retailerId);
    },
    [customerOrders]
  );

  const getRetailerProcurementOrders = useCallback(
    (retailerId?: string): RetailerProcurementOrder[] => {
      if (!retailerId) return procurementOrders;
      return procurementOrders.filter((po) => po.retailerId === retailerId);
    },
    [procurementOrders]
  );

  const getSupplierBuyerRequests = useCallback(
    (supplierId?: string): RetailerProcurementOrder[] => {
      if (!supplierId) return procurementOrders;
      return procurementOrders.filter((po) => po.supplierId === supplierId);
    },
    [procurementOrders]
  );

  return (
    <SupplyChainContext.Provider
      value={{
        customerOrders,
        procurementOrders,
        inventoryOverrides,
        addCustomerOrder,
        createRetailerStockOrder,
        acceptSupplierOrder,
        cancelSupplierOrder,
        dispatchSupplierOrder,
        deliverSupplierOrder,
        fulfillSupplierOrder,
        updateInventory,
        getRetailerInventory,
        getCustomerOrders,
        getRetailerProcurementOrders,
        getSupplierBuyerRequests,
      }}
    >
      {children}
    </SupplyChainContext.Provider>
  );
};

export const useSupplyChain = () => {
  const ctx = useContext(SupplyChainContext);
  if (!ctx) {
    throw new Error('useSupplyChain must be used within a SupplyChainProvider');
  }
  return ctx;
};
