/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WaterAnalysis {
  score: number;
  verdict: 'SAFE TO DRINK' | 'CAUTION - BOIL FIRST' | 'NOT SAFE TO DRINK' | 'DANGEROUS';
  color_detected: string;
  turbidity: 'CLEAR' | 'SLIGHTLY CLOUDY' | 'CLOUDY' | 'VERY CLOUDY' | 'OPAQUE';
  sediment: 'NONE' | 'SLIGHT' | 'MODERATE' | 'HEAVY';
  foam: 'NONE' | 'SLIGHT' | 'SIGNIFICANT';
  likely_contaminants: string[];
  health_risks: string[];
  recommendation: string;
  analysis_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  disclaimer: string;
}

export interface AnalysisRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export type ScoreLevel = 'safe' | 'caution' | 'danger';
