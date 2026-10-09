import type { FieldValue, Timestamp } from 'firebase/firestore';

export interface CustomerOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface CustomerOrder {
  id?: string;
  customerId: string;
  customerName: string;
  retailerId: string;
  items: CustomerOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled';
  paymentMethod?: string;
  createdAt: FieldValue | Timestamp | Date | number | string;
}

export interface RetailerProcurementItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface RetailerProcurementOrder {
  id?: string;
  retailerId: string;
  retailerName: string;
  supplierId: string;
  supplierName: string;
  items: RetailerProcurementItem[];
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Dispatched' | 'Delivered' | 'Cancelled';
  createdAt: FieldValue | Timestamp | Date | number | string;
  acceptedAt?: FieldValue | Timestamp | Date | number | string | null;
  dispatchedAt?: FieldValue | Timestamp | Date | number | string | null;
  deliveredAt?: FieldValue | Timestamp | Date | number | string | null;
  cancelledAt?: FieldValue | Timestamp | Date | number | string | null;
  cancellationReason?: string | null;
  isDemo?: boolean;
}

export interface DemandSignal {
  id?: string;
  retailerId: string;
  productId: string;
  productName: string;
  quantity: number;
  source: 'customer_purchase' | 'manual_forecast' | 'replenishment';
  customerOrderId: string;
  timestamp: FieldValue | Timestamp | Date | number | string;
}

export interface InventoryItem {
  id?: string;
  retailerId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  updatedAt: FieldValue | Timestamp | Date | number | string;
}
