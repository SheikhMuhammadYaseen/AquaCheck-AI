/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScoreLevel } from '../types/analysis';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 8) return 'safe';
  if (score >= 5) return 'caution';
  return 'danger';
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 8) return 'Good';
  if (score >= 5) return 'Caution';
  if (score >= 3) return 'Poor';
  return 'Dangerous';
}

export function getScoreColors(score: number): {
  bg: string;
  border: string;
  text: string;
  badge: string;
  hex: string;
} {
  const level = getScoreLevel(score);
  if (level === 'safe') {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
      hex: '#10B981',
    };
  }
  if (level === 'caution') {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
      hex: '#F59E0B',
    };
  }
  return {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
    hex: '#EF4444',
  };
}
