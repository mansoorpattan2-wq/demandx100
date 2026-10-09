/**
 * DemandX Inventory Decision Layer Service
 * -----------------------------------------
 * Sits directly on top of the ML prediction system (/api/predict-demand).
 * Translates ML forecast outputs into actionable, transparent supply chain business decisions.
 * 
 * Decision Formula:
 *   safetyStock = round(forecastDemand * safetyFactor)
 *   reorderLevel = round((forecastDemand * (leadTimeDays / horizonDays)) + safetyStock)
 *   recommendedProcurementQuantity = max(0, forecastDemand + safetyStock - currentStock)
 */

import type { Product } from '../data/products';
import { getForecastFromDemandSignals } from './demandForecastService';
import { fetchDemandSignalsDoc } from './firestoreService';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface ProductInventoryDecision {
  productId: string;
  productName: string;
  category: string;
  icon: string;
  unit: string;
  
  // 1. Current Live Inventory
  currentStock: number;
  
  // 2. Recent Demand (7-day / 30-day historical average from demand signals)
  recentDemand: number;
  
  // 3. Forecast Demand from ML Prediction Endpoint (/api/predict-demand)
  forecastDemand: number;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // 4. Decision Layer Calculations
  safetyStock: number;
  reorderLevel: number;
  
  // 5. Risk Assessment
  stockoutRisk: RiskLevel;
  overstockRisk: RiskLevel;
  
  // 6. Recommended Procurement Decision
  recommendedOrder: number;
  
  // Metadata & Transparency
  formulaExplanation: string;
  isFallbackModel?: boolean;
}

/**
 * Calculates safety stock for a product based on forecast demand and lead time.
 * Standard safety buffer = 15% of projected horizon demand.
 */
export function calculateSafetyStock(forecastDemand: number, leadTimeDays: number = 4): number {
  const baseBufferRatio = 0.15; // 15% buffer
  const leadTimeFactor = Math.sqrt(leadTimeDays / 4);
  return Math.round(forecastDemand * baseBufferRatio * leadTimeFactor);
}

/**
 * Calculates the stock reorder level threshold.
 * Reorder Level = (Daily Forecast Demand * Lead Time Days) + Safety Stock
 */
export function calculateReorderLevel(forecastDemand: number, leadTimeDays: number = 4, safetyStock: number): number {
  const dailyDemand = forecastDemand / 30; // 30-day horizon
  return Math.round(dailyDemand * leadTimeDays + safetyStock);
}

/**
 * Core DemandX Business Decision Function:
 * recommendedOrder = max(0, forecastDemand + safetyStock - currentStock)
 */
export function calculateRecommendedOrder(
  forecastDemand: number,
  safetyStock: number,
  currentStock: number
): number {
  return Math.max(0, forecastDemand + safetyStock - currentStock);
}

/**
 * Evaluates Stockout Risk based on live stock vs reorder level & forecast.
 */
export function evaluateStockoutRisk(currentStock: number, reorderLevel: number, forecastDemand: number): RiskLevel {
  if (currentStock <= 0) return 'HIGH';
  if (currentStock <= reorderLevel) return 'HIGH';
  if (currentStock < forecastDemand * 0.5) return 'MEDIUM';
  if (currentStock < forecastDemand * 0.85) return 'LOW';
  return 'NONE';
}

/**
 * Evaluates Overstock Risk based on live stock vs total target holding capacity.
 */
export function evaluateOverstockRisk(currentStock: number, forecastDemand: number, safetyStock: number): RiskLevel {
  const maxTargetCapacity = forecastDemand + safetyStock;
  if (currentStock >= maxTargetCapacity * 1.4) return 'HIGH';
  if (currentStock >= maxTargetCapacity * 1.15) return 'MEDIUM';
  if (currentStock > maxTargetCapacity) return 'MEDIUM';
  return 'LOW';
}

/**
 * Evaluates a single product's inventory decision using live stock and real ML predictions.
 */
export async function computeProductDecision(
  product: Product,
  currentStock: number,
  retailerId: string = 'GUNTUR_STORE_01'
): Promise<ProductInventoryDecision> {
  // 1. Fetch real historical demand signals to compute recent demand
  let recentDemand = Math.round(product.predictedDemand / 4); // fallback 7-day estimate
  try {
    const rawSignals = await fetchDemandSignalsDoc(retailerId, product.id);
    if (rawSignals.length > 0) {
      const totalSignalsQty = rawSignals.reduce((sum, s) => sum + (s.quantity || 0), 0);
      recentDemand = totalSignalsQty;
    }
  } catch (err) {
    console.warn(`Could not fetch demand signals for ${product.id}, using fallback:`, err);
  }

  // 2. Obtain real ML forecast from /api/predict-demand via demandForecastService adapter
  let forecastDemand = product.predictedDemand;
  let demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  let isFallbackModel = false;

  try {
    const forecastResult = await getForecastFromDemandSignals({
      retailerId,
      productId: product.id,
      openingStock: currentStock,
    });
    if (forecastResult && forecastResult.predicted_demand > 0) {
      forecastDemand = forecastResult.predicted_demand;
      demandLevel = forecastResult.demand_level || 'MEDIUM';
      isFallbackModel = forecastResult.is_fallback || false;
    }
  } catch (err) {
    console.warn(`Forecast API call failed for ${product.id}, using product baseline forecast:`, err);
  }

  // 3. Apply DemandX Business Decision Layer Formula
  const leadTimeDays = product.replenishmentDays || 4;
  const safetyStock = calculateSafetyStock(forecastDemand, leadTimeDays);
  const reorderLevel = calculateReorderLevel(forecastDemand, leadTimeDays, safetyStock);
  const recommendedOrder = calculateRecommendedOrder(forecastDemand, safetyStock, currentStock);

  // 4. Assess Risks
  const stockoutRisk = evaluateStockoutRisk(currentStock, reorderLevel, forecastDemand);
  const overstockRisk = evaluateOverstockRisk(currentStock, forecastDemand, safetyStock);

  const formulaExplanation = `recommendedOrder = max(0, ${forecastDemand} [ML Forecast] + ${safetyStock} [Safety Buffer] - ${currentStock} [Live Stock]) = ${recommendedOrder} ${product.unit}`;

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    icon: product.icon,
    unit: product.unit,
    currentStock,
    recentDemand,
    forecastDemand,
    demandLevel,
    safetyStock,
    reorderLevel,
    stockoutRisk,
    overstockRisk,
    recommendedOrder,
    formulaExplanation,
    isFallbackModel,
  };
}

/**
 * Synchronous fallback evaluator for instant UI rendering while async ML predictions load.
 */
export function computeProductDecisionSync(
  product: Product,
  currentStock: number
): ProductInventoryDecision {
  const forecastDemand = product.predictedDemand;
  const leadTimeDays = product.replenishmentDays || 4;
  const safetyStock = calculateSafetyStock(forecastDemand, leadTimeDays);
  const reorderLevel = calculateReorderLevel(forecastDemand, leadTimeDays, safetyStock);
  const recommendedOrder = calculateRecommendedOrder(forecastDemand, safetyStock, currentStock);
  const stockoutRisk = evaluateStockoutRisk(currentStock, reorderLevel, forecastDemand);
  const overstockRisk = evaluateOverstockRisk(currentStock, forecastDemand, safetyStock);

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    icon: product.icon,
    unit: product.unit,
    currentStock,
    recentDemand: Math.round(product.predictedDemand / 4),
    forecastDemand,
    demandLevel: forecastDemand > 3500 ? 'HIGH' : forecastDemand > 2000 ? 'MEDIUM' : 'LOW',
    safetyStock,
    reorderLevel,
    stockoutRisk,
    overstockRisk,
    recommendedOrder,
    formulaExplanation: `recommendedOrder = max(0, ${forecastDemand} [ML Forecast] + ${safetyStock} [Safety Buffer] - ${currentStock} [Live Stock]) = ${recommendedOrder} ${product.unit}`,
    isFallbackModel: true,
  };
}
