/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CommunityReport {
  id: string;
  created_at: string;
  country: string;
  city: string;
  location_description: string | null;
  display_name: string;
  description: string | null;
  image_url: string | null;
  safety_score: number;
  verdict: string;
  color_detected: string | null;
  contaminants: string[];
  health_risks: string[];
  needs_review: boolean;
  language: string;
}

export type ReportSubmission = Omit<CommunityReport, 'id' | 'created_at' | 'needs_review'>;
