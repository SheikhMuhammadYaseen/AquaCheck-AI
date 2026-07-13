/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CityWaterData, CityLookupResult } from '../types/city';
import { RiskProjection } from '../types/health';
import waterDataRaw from '../../data/water-by-city.json' with { type: 'json' };

let waterData = [...waterDataRaw] as CityWaterData[];

export function getRawWaterData(): CityWaterData[] {
  return waterData;
}

export function updateCityInMemoryCache(newData: CityWaterData): void {
  const normCountry = normalize(newData.country);
  const normCity = normalize(newData.city);
  const index = waterData.findIndex(
    (item) => normalize(item.country) === normCountry && normalize(item.city) === normCity
  );
  if (index !== -1) {
    waterData[index] = { ...waterData[index], ...newData };
  } else {
    waterData.push(newData);
  }
}

export function setCitiesInMemoryCache(cities: CityWaterData[]): void {
  if (cities && cities.length > 0) {
    // Merge database cities into our memory cache
    cities.forEach((dbCity) => {
      updateCityInMemoryCache(dbCity);
    });
  }
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function getCityData(country: string, city: string): CityLookupResult {
  const normCountry = normalize(country);
  const normCity = normalize(city);

  const matched = waterData.find(
    (item) => normalize(item.country) === normCountry && normalize(item.city) === normCity
  );

  if (matched) {
    return { found: true, data: matched };
  }

  // Suggest up to 3 partial matches
  const suggestions = waterData
    .filter(
      (item) =>
        normalize(item.city).includes(normCity) ||
        normalize(item.country).includes(normCountry)
    )
    .slice(0, 3)
    .map((item) => ({ country: item.country, city: item.city }));

  return { found: false, suggestions };
}

export function listAvailableCities(): { country: string; city: string }[] {
  return waterData
    .map((item) => ({ country: item.country, city: item.city }))
    .sort((a, b) => {
      const countryCompare = a.country.localeCompare(b.country);
      if (countryCompare !== 0) return countryCompare;
      return a.city.localeCompare(b.city);
    });
}

export function listCountries(): string[] {
  const countries = Array.from(new Set(waterData.map((item) => item.country)));
  return countries.sort();
}

export function getCitiesInCountry(country: string): string[] {
  const normCountry = normalize(country);
  return waterData
    .filter((item) => normalize(item.country) === normCountry)
    .map((item) => item.city)
    .sort();
}

export function calculateProjection(data: CityWaterData): RiskProjection {
  const current_year = new Date().getFullYear();
  const trend = data.historical_trend;

  let slope = 0;
  if (trend && trend.length >= 2) {
    const first = trend[0];
    const last = trend[trend.length - 1];
    if (last.year !== first.year) {
      slope = (last.population_percent_unsafe - first.population_percent_unsafe) / (last.year - first.year);
    }
  }

  // Years to project: current_year, +2, +5, +10
  const years = [current_year, current_year + 2, current_year + 5, current_year + 10];
  const lastKnown = trend && trend.length > 0 ? trend[trend.length - 1] : { year: current_year, population_percent_unsafe: data.population_percent_unsafe };

  const projected_data = years.map((year) => {
    const years_from_last_known = year - lastKnown.year;
    let val = lastKnown.population_percent_unsafe + slope * years_from_last_known;
    val = Math.max(0, Math.min(100, Math.round(val))); // round to nearest integer and clamp

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (trend && trend.length >= 4) confidence = 'HIGH';
    else if (trend && trend.length >= 2) confidence = 'MEDIUM';

    return {
      year,
      projected_percent_unsafe: val,
      confidence
    };
  });

  const firstYearStr = trend && trend.length > 0 ? trend[0].year.toString() : 'the past';
  const lastYearStr = trend && trend.length > 0 ? trend[trend.length - 1].year.toString() : 'present';

  return {
    city: data.city,
    country: data.country,
    current_year,
    projected_data,
    narrative: '',
    assumptions: `Based on historical trend from ${firstYearStr} to ${lastYearStr}. Projection assumes current conditions and development pace continue unchanged.`
  };
}
