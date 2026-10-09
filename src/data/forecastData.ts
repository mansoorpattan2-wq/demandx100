export interface ForecastDataPoint {
  period: string;
  historical?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export const FORECAST_DATA_7D: ForecastDataPoint[] = [
  { period: 'Day 1', historical: 420, predicted: 420, lowerBound: 400, upperBound: 440 },
  { period: 'Day 2', historical: 450, predicted: 460, lowerBound: 435, upperBound: 485 },
  { period: 'Day 3', historical: 480, predicted: 490, lowerBound: 460, upperBound: 520 },
  { period: 'Day 4', predicted: 530, lowerBound: 495, upperBound: 565 },
  { period: 'Day 5', predicted: 580, lowerBound: 540, upperBound: 620 },
  { period: 'Day 6', predicted: 620, lowerBound: 575, upperBound: 665 },
  { period: 'Day 7', predicted: 670, lowerBound: 620, upperBound: 720 },
];

export const FORECAST_DATA_30D: ForecastDataPoint[] = [
  { period: 'Week 1', historical: 2800, predicted: 2850, lowerBound: 2700, upperBound: 3000 },
  { period: 'Week 2', historical: 3100, predicted: 3200, lowerBound: 3000, upperBound: 3400 },
  { period: 'Week 3', predicted: 3600, lowerBound: 3350, upperBound: 3850 },
  { period: 'Week 4', predicted: 4200, lowerBound: 3900, upperBound: 4500 },
];

export const FORECAST_DATA_3M: ForecastDataPoint[] = [
  { period: 'Month 1', historical: 12500, predicted: 12800, lowerBound: 12000, upperBound: 13600 },
  { period: 'Month 2', predicted: 15400, lowerBound: 14200, upperBound: 16600 },
  { period: 'Month 3', predicted: 18900, lowerBound: 17100, upperBound: 20700 },
];

export const FORECAST_DATA_6M: ForecastDataPoint[] = [
  { period: 'Jan', historical: 1200, predicted: 1100, lowerBound: 1000, upperBound: 1200 },
  { period: 'Feb', historical: 1600, predicted: 1500, lowerBound: 1400, upperBound: 1600 },
  { period: 'Mar', historical: 2200, predicted: 2400, lowerBound: 2200, upperBound: 2600 },
  { period: 'Apr', predicted: 3400, lowerBound: 3100, upperBound: 3700 },
  { period: 'May', predicted: 4300, lowerBound: 3900, upperBound: 4700 },
  { period: 'Jun', predicted: 5200, lowerBound: 4700, upperBound: 5700 },
];
