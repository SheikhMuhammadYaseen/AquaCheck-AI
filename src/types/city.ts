/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiseaseBreakdownItem {
  disease: string;
  estimated_percent: number;
  description: string;
}

export interface HistoricalDataPoint {
  year: number;
  population_percent_unsafe: number;
}

export interface CityWaterData {
  country: string;
  city: string;
  safety_score: number;
  safety_label: 'SAFE' | 'CAUTION' | 'UNSAFE';
  typical_color: string;
  typical_color_hex: string;
  population_percent_unsafe: number;
  estimated_yearly_deaths: number | null;
  common_contaminants: string[];
  primary_source_type: string;
  data_source: string;
  last_updated: string;
  notes: string | null;
  disease_breakdown: DiseaseBreakdownItem[];
  historical_trend: HistoricalDataPoint[];
  economic_loss_usd_millions: number | null;
  children_under5_deaths: number | null;
  future_risk_level: 'IMPROVING' | 'STABLE' | 'WORSENING';
  future_risk_reason: string;
}

export type CityLookupResult =
  | { found: true; data: CityWaterData }
  | { found: false; suggestions: { country: string; city: string }[] };
