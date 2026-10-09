import React, { useState } from 'react';
import { X, Truck, Plus, Trash2, ArrowRight, PackageCheck, Loader2 } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useSupplyChain } from '../contexts/SupplyChainContext';
import { useToast } from './Toast';
import type { RetailerProcurementItem } from '../types/firestore';

interface ProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailerStoreName?: string;
  initialProduct?: any;
  initialQuantity?: number;
}

const SUPPLIERS = [
  { id: 'GUNTUR_SUPPLIER_HUB', name: 'Guntur Spice Traders & Exporters (Regional Supplier A)', region: 'Guntur Spice Mandi' },
  { id: 'VIJAYAWADA_FARMERS_HUB', name: 'Vijayawada Farmers Producer Co. (Regional Supplier B)', region: 'Vijayawada Mandi' },
  { id: 'ANDHRA_OIL_MILLS', name: 'Andhra Oil & Grains Wholesale Hub', region: 'AP Agro Processing Zone' },
];

export const ProcurementModal: React.FC<ProcurementModalProps> = ({
  isOpen,
  onClose,
  retailerStoreName = 'My Store - Guntur, AP',
  initialProduct,
  initialQuantity,
}) => {
  const { createRetailerStockOrder } = useSupplyChain();
  const { showToast } = useToast();

  const [selectedSupplierId, setSelectedSupplierId] = useState(SUPPLIERS[0].id);
  const [items, setItems] = useState<RetailerProcurementItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPOId, setSubmittedPOId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setItems([
          {
            productId: initialProduct.id,
            productName: initialProduct.name,
            quantity: initialQuantity || initialProduct.recommendedStock || 1000,
            unit: initialProduct.unit,
            price: Math.round(initialProduct.currentPrice * 0.85),
          },
        ]);
      } else if (items.length === 0) {
        setItems([
          { productId: 'sona-masoori-rice', productName: 'Babu Super Sona Masoori Rice (5kg)', quantity: 50, unit: '5kg bag', price: 290 },
          { productId: 'sugar', productName: 'Madhur Pure Crystal Sugar (5kg)', quantity: 40, unit: '5kg bag', price: 210 },
        ]);
      }
    }
  }, [isOpen, initialProduct, initialQuantity]);

  if (!isOpen) return null;

  const currentSupplier = SUPPLIERS.find((s) => s.id === selectedSupplierId) || SUPPLIERS[0];
  const grandTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateItem = (index: number, field: keyof RetailerProcurementItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = PRODUCTS.find((p) => p.id === val);
        if (prod) {
          copy[index] = {
            ...copy[index],
            productId: prod.id,
            productName: prod.name,
            unit: prod.unit,
            price: Math.round(prod.currentPrice * 0.85), // wholesale rate discount
          };
        }
      } else {
        copy[index] = { ...copy[index], [field]: val };
      }
      return copy;
    });
  };

  const handleAddItem = () => {
    const unadded = PRODUCTS.find((p) => !items.some((i) => i.productId === p.id)) || PRODUCTS[0];
    setItems((prev) => [
      ...prev,
      {
        productId: unadded.id,
        productName: unadded.name,
        quantity: 1000,
        unit: unadded.unit,
        price: Math.round(unadded.currentPrice * 0.85),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || isSubmitting) return;

    // Invalid quantity validation
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        showToast('Invalid Quantity', `Please enter a valid quantity for "${item.productName}".`, 'warning');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const poId = await createRetailerStockOrder(
        items,
        currentSupplier.id,
        currentSupplier.name,
        'GUNTUR_STORE_01',
        retailerStoreName
      );

      setSubmittedPOId(poId);
      showToast(
        'Order submitted successfully.',
        `Order ${poId} sent to ${currentSupplier.name}. Status: Pending Supplier Dispatch.`,
        'success'
      );
    } catch (err: any) {
      console.error('Procurement order error:', err);
      showToast('Order Submission Failed', 'Unable to submit order. Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedPOId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 space-y-0">
        {/* Modal Header */}
        <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Order Stock from Supplier</h3>
              <p className="text-[10px] text-blue-200">Create B2B procurement order for store inventory replenishment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        {submittedPOId ? (
          /* Confirmation Screen */
          <div className="p-6 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <PackageCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Procurement Request Sent!</h4>
              <p className="text-xs text-slate-500 font-medium">
                Order ID: <span className="font-bold text-slate-900">{submittedPOId}</span> • Status: <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2 text-slate-600">
                <span>Selected Supplier</span>
                <span className="font-bold text-slate-900">{currentSupplier.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-slate-600">
                <span>Items Ordered</span>
                <span className="font-bold text-slate-900">{items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Total Cost</span>
                <span className="font-bold text-emerald-800">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-950 text-left">
              <span className="font-bold block">📡 B2B Sync Transmitted</span>
              This procurement request is now immediately visible on the Supplier Dashboard for acceptance & dispatch.
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Order Form */
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Step 1: Select Supplier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 block">1. Select B2B Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 cursor-pointer shadow-2xs"
              >
                {SUPPLIERS.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Items & Quantities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">2. Select Products & Procurement Quantities</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                        className="w-full text-xs font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-900 cursor-pointer"
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.icon} {p.name} ({p.unit}) — ₹{Math.round(p.currentPrice * 0.85)}/unit
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-24 text-xs font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-900 text-right focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500">{item.unit}</span>
                      </div>

                      <span className="text-xs font-bold text-slate-800 min-w-[70px] text-right">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Order Review Summary */}
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-blue-950 border-b border-blue-200 pb-2">
                <span>Procurement Order Total ({items.length} items)</span>
                <span className="text-sm font-black text-blue-900">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Submitting this request will automatically alert <span className="font-bold text-slate-900">{currentSupplier.name}</span> in Guntur/AP for dispatch processing.
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={isSubmitting || items.length === 0}
              onClick={handleSubmit}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting Procurement Order...</span>
                </>
              ) : (
                <>
                  <span>Submit Procurement Order · ₹{grandTotal.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
