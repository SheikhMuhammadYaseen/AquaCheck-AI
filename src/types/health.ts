/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RiskProjection {
  city: string;
  country: string;
  current_year: number;
  projected_data: {
    year: number;
    projected_percent_unsafe: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  narrative: string;
  assumptions: string;
}
