/**
 * DemandX FastAPI Backend Service Client
 * Connects React frontend directly to FastAPI backend ML prediction endpoints.
 */

export interface DemandPredictionPayload {
  Product_Name: string;
  Category: string;
  Brand: string;
  State: string;
  City: string;
  Region: string;
  City_Tier: string;
  Season: string;
  Festival_Event?: string;
  Weather?: string;
  Promotion?: string;
  Day?: string;
  Month?: number;
  Year?: number;
  Week?: number;
  Weekend?: number;
  Holiday?: number;
  Temperature_C?: number;
  Rainfall_mm?: number;
  Humidity_pct?: number;
  Selling_Price_INR: number;
  MRP_INR: number;
  Discount_pct?: number;
  Competitor_Price_INR?: number;
  Opening_Stock: number;
  Customer_Footfall?: number;
  Lead_Time_Days?: number;
  Prev_Day_Demand?: number;
  '7_Day_Avg_Demand'?: number;
  '30_Day_Avg_Demand'?: number;
}

export interface DemandPredictionResult {
  success: boolean;
  predicted_demand: number;
  demand_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_stock: number;
  recommended_reorder_quantity: number;
  product?: string;
  city?: string;
  is_fallback?: boolean;
}

export interface HealthStatus {
  status: string;
  model: string;
  r2: number;
}

// Configurable API base URL from environment variable VITE_API_BASE_URL or fallback
const ENV_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
'http://127.0.0.1:8001';
const CLEAN_BASE = ENV_URL.replace(/\/$/, '');
export const API_BASE_URL = CLEAN_BASE.endsWith('/api') ? CLEAN_BASE : `${CLEAN_BASE}/api`;

/**
 * Checks backend health status and loaded model metrics.
 */
export async function getBackendHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('DemandX Backend API health check failed:', err);
    return null;
  }
}

/**
 * Intelligent client-side fallback calculation when FastAPI backend is offline.
 */
function calculateFallbackPrediction(payload: DemandPredictionPayload): DemandPredictionResult {
  const baseDemand = payload.Prev_Day_Demand || payload['7_Day_Avg_Demand'] || 55;
  const priceRatio = payload.MRP_INR > 0 ? (payload.Selling_Price_INR / payload.MRP_INR) : 1;
  const priceFactor = 1 + (1 - priceRatio) * 0.4;
  const footfallFactor = payload.Customer_Footfall ? Math.min(1.5, Math.max(0.6, payload.Customer_Footfall / 600)) : 1;
  
  let eventFactor = 1.0;
  if (payload.Festival_Event && payload.Festival_Event !== 'None') {
    eventFactor = 1.25;
  }
  if (payload.Promotion === 'Yes') {
    eventFactor *= 1.15;
  }

  const calculated = Math.round(baseDemand * priceFactor * footfallFactor * eventFactor);
  const predicted = Math.max(10, calculated);

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (predicted < 50) level = 'LOW';
  else if (predicted > 150) level = 'HIGH';

  const recStock = Math.round(predicted * 1.15);
  const reorder = Math.max(0, recStock - (payload.Opening_Stock || 0));

  return {
    success: true,
    predicted_demand: predicted,
    demand_level: level,
    recommended_stock: recStock,
    recommended_reorder_quantity: reorder,
    product: payload.Product_Name,
    city: payload.City,
    is_fallback: true
  };
}

/**
 * Invokes trained ML model prediction API endpoint (POST /api/predict-demand).
 * Falls back to intelligent estimator if FastAPI backend server is unreachable.
 */
export async function fetchDemandPrediction(
  payload: DemandPredictionPayload
): Promise<DemandPredictionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/predict-demand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`API error HTTP ${res.status}`);
    }

    const data: DemandPredictionResult = await res.json();
    return { ...data, is_fallback: false };
  } catch (err) {
    console.warn('DemandX AI Backend prediction API unreachable, using fallback estimator:', err);
    return calculateFallbackPrediction(payload);
  }
}

// ============================================================================
// JARVIS AI ASSISTANT & RAG KNOWLEDGE API CLIENT
// ============================================================================

export interface JarvisChatPayload {
  query: string;
  session_id?: string;
  role?: string;
  store_id?: string;
  preferred_lang?: 'en' | 'te' | 'hi' | 'auto';
  user_name?: string;
}

export interface RAGCitation {
  title: string;
  source: string;
  relevance_score: number;
  citation: string;
  excerpt: string;
}

export interface JarvisChatResponse {
  session_id: string;
  reply: string;
  language: 'en' | 'te' | 'hi';
  intent: string;
  tools_executed: string[];
  forecast_card?: {
    product_name: string;
    city: string;
    season: string;
    festival: string;
    predicted_daily_demand: number;
    demand_level: string;
    recommended_safety_stock: number;
    current_opening_stock: number;
    suggested_reorder_qty: number;
    model_metadata?: {
      algorithm: string;
      accuracy_r2: number;
      mae: string;
    };
  };
  stock_risk_card?: {
    critical_count: number;
    risks: Array<{
      product_id: string;
      product_name: string;
      current_stock: number;
      days_of_supply: number;
      lead_time_days: number;
      risk_status: string;
      risk_score: number;
      recommended_action: string;
    }>;
  };
  reorder_draft?: {
    draft_id: string;
    store_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_estimated_inr: number;
    supplier_id: string;
    supplier_name: string;
    lead_time_days: number;
    status: string;
    confirmation_token: string;
  };
  batch_expiry_card?: {
    critical_count: number;
    total_tracked: number;
    batches: Array<{
      product_id: string;
      product_name: string;
      category: string;
      batch_number: string;
      mfg_date: string;
      best_before_date: string;
      days_to_expiry: number;
      quantity: number;
      risk_level: string;
      recommended_action: string;
    }>;
  };
  order_status_card?: {
    order_id: string;
    store_id: string;
    supplier_id: string;
    supplier_name?: string;
    status: string;
    total_inr: number;
    lead_time_days?: number;
    created_at?: string;
    items?: Array<{
      product_id: string;
      name: string;
      qty: number;
      unit: string;
      price: number;
      total_price?: number;
    }>;
  };
  action_confirmation?: {
    action_type: string;
    target_id: string;
    requires_explicit_confirmation: boolean;
  };
  citations: RAGCitation[];
  execution_time_ms: number;
  provider_used: string;
}

/**
 * Sends a natural language query (voice transcript or text) to JARVIS Assistant Core.
 */
export async function sendJarvisMessage(
  payload: JarvisChatPayload
): Promise<JarvisChatResponse> {
  const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Assistant API failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Confirms an uncommitted reorder draft to submit purchase order to supplier.
 */
export async function confirmJarvisReorderDraft(
  draftId: string,
  role: string = 'retailer',
  storeId: string = 'GUNTUR_STORE_01'
): Promise<{ success: boolean; message: string; order: any }> {
  const res = await fetch(`${API_BASE_URL}/assistant/reorder/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      draft_id: draftId,
      role: role,
      store_id: storeId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Reorder confirmation failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Explicitly cancels an uncommitted reorder draft.
 */
export async function cancelJarvisReorderDraft(
  draftId: string,
  role: string = 'retailer',
  storeId: string = 'GUNTUR_STORE_01'
): Promise<{ success: boolean; message: string; result: any }> {
  const res = await fetch(`${API_BASE_URL}/assistant/reorder/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      draft_id: draftId,
      role: role,
      store_id: storeId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Draft cancellation failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Explicitly cancels an authorized purchase order.
 */
export async function cancelJarvisOrder(
  orderId: string,
  role: string = 'retailer',
  storeId: string = 'GUNTUR_STORE_01',
  reason: string = 'Customer explicit cancellation request'
): Promise<{ success: boolean; message: string; order: any }> {
  const res = await fetch(`${API_BASE_URL}/assistant/orders/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: orderId,
      role: role,
      store_id: storeId,
      reason: reason,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Order cancellation failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Fetches batch expiration risks and tracking info.
 */
export async function fetchBatchExpiryRisks(
  role: string = 'retailer',
  storeId: string = 'GUNTUR_STORE_01'
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/assistant/batches/expiry?role=${encodeURIComponent(role)}&store_id=${encodeURIComponent(storeId)}`);
  if (!res.ok) {
    throw new Error(`Batch expiry lookup failed (${res.status})`);
  }
  return await res.json();
}

/**
 * Queries RAG knowledge base directly for verified documents and citations.
 */
export async function searchKnowledgeBase(
  query: string,
  role: string = 'retailer',
  tenantId: string = 'GLOBAL'
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/knowledge/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      role,
      tenant_id: tenantId,
      top_k: 3,
    }),
  });

  if (!res.ok) {
    throw new Error(`RAG search failed (${res.status})`);
  }

  return await res.json();
}

