/**
 * DemandX Forecast Service Adapter
 * -------------------------------
 * Connects real-time Firestore customer demandSignals to the existing ML prediction engine (/api/predict-demand).
 * Transforms raw customer demand signals into the exact DemandPredictionPayload expected by the XGBoost ML model.
 */

import { fetchDemandSignalsDoc } from './firestoreService';
import { fetchDemandPrediction } from './api';
import type { DemandPredictionPayload, DemandPredictionResult } from './api';
import { PRODUCTS } from '../data/products';

export interface ForecastOptions {
  retailerId?: string;
  productId: string;
  openingStock?: number;
  city?: string;
  state?: string;
  region?: string;
}

/**
 * Reads historical demandSignals for a product/retailer, aggregates them by 1-day, 7-day, and 30-day windows,
 * constructs the ML payload, and invokes /api/predict-demand.
 */
export async function getForecastFromDemandSignals(
  options: ForecastOptions
): Promise<DemandPredictionResult> {
  const retailerId = options.retailerId || 'GUNTUR_STORE_01';
  const productId = options.productId;

  // 1. Find product details from products catalog
  const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];

  // 2. Fetch historical demand signals from Firestore
  const rawSignals = await fetchDemandSignalsDoc(retailerId, productId);

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

  let prevDaySum = 0;
  let sevenDaySum = 0;
  let thirtyDaySum = 0;

  for (const sig of rawSignals) {
    let sigTime = now;
    if (sig.timestamp?.toDate) {
      sigTime = sig.timestamp.toDate().getTime();
    } else if (typeof sig.timestamp === 'number') {
      sigTime = sig.timestamp;
    }

    const ageMs = now - sigTime;
    const qty = sig.quantity || 0;

    if (ageMs <= ONE_DAY_MS) {
      prevDaySum += qty;
    }
    if (ageMs <= SEVEN_DAYS_MS) {
      sevenDaySum += qty;
    }
    if (ageMs <= THIRTY_DAYS_MS) {
      thirtyDaySum += qty;
    }
  }

  // 3. Compute aggregated demand values (falling back to product baseline if cold start)
  const prevDayDemand = prevDaySum > 0 ? prevDaySum : Math.round(product.predictedDemand / 30);
  const avgDemand7Day = sevenDaySum > 0 ? Math.round(sevenDaySum / 7) : Math.round(product.predictedDemand / 30);
  const avgDemand30Day = thirtyDaySum > 0 ? Math.round(thirtyDaySum / 30) : Math.round(product.predictedDemand / 30);

  // 4. Construct exact payload for /api/predict-demand ML endpoint
  const currentDate = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[currentDate.getDay()];
  const monthNum = currentDate.getMonth() + 1;
  const yearNum = currentDate.getFullYear();
  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6 ? 1 : 0;

  const payload: DemandPredictionPayload = {
    Product_Name: product.name,
    Category: product.category,
    Brand: product.brand || 'DemandX',
    State: options.state || 'Andhra Pradesh',
    City: options.city || 'Guntur',
    Region: options.region || 'South',
    City_Tier: 'Tier 2',
    Season: 'Monsoon',
    Festival_Event: 'None',
    Weather: 'Clear',
    Promotion: 'No',
    Day: dayName,
    Month: monthNum,
    Year: yearNum,
    Week: Math.ceil(((currentDate.getTime() - new Date(yearNum, 0, 1).getTime()) / ONE_DAY_MS + 1) / 7),
    Weekend: isWeekend,
    Holiday: 0,
    Temperature_C: 28.0,
    Rainfall_mm: 0.0,
    Humidity_pct: 65,
    Selling_Price_INR: product.currentPrice,
    MRP_INR: product.mrp,
    Discount_pct: product.mrp > 0 ? Math.round(((product.mrp - product.currentPrice) / product.mrp) * 100) : 0,
    Competitor_Price_INR: product.avgPrice,
    Opening_Stock: options.openingStock ?? product.currentStock,
    Customer_Footfall: 650,
    Lead_Time_Days: product.replenishmentDays || 4,
    Prev_Day_Demand: prevDayDemand,
    '7_Day_Avg_Demand': avgDemand7Day,
    '30_Day_Avg_Demand': avgDemand30Day,
  };

  // 5. Invoke ML API endpoint
  return await fetchDemandPrediction(payload);
}
