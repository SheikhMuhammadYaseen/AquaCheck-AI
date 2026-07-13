/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, ZoomIn, ZoomOut, RotateCcw, Filter, HelpCircle } from 'lucide-react';
import { getScoreColors, getScoreLabel } from '../lib/scoring';
import { useT } from '../lib/locale';
import { CityWaterData } from '../types/city';
import { getCityData } from '../lib/cityData';

export interface WorldMapProps {
  onCitySelected: (country: string, city: string) => void;
}

// Fixed GPS Longitude/Latitude coordinates for the database cities
const CITY_COORDS: Record<string, { lat: number; lng: number; country: string }> = {
  'Karachi': { lat: 24.86, lng: 67.01, country: 'Pakistan' },
  'Lahore': { lat: 31.55, lng: 74.34, country: 'Pakistan' },
  'Islamabad': { lat: 33.72, lng: 73.04, country: 'Pakistan' },
  'Peshawar': { lat: 34.01, lng: 71.56, country: 'Pakistan' },
  'Delhi': { lat: 28.70, lng: 77.10, country: 'India' },
  'Mumbai': { lat: 19.07, lng: 72.87, country: 'India' },
  'Dhaka': { lat: 23.72, lng: 90.40, country: 'Bangladesh' },
  'Nairobi': { lat: -1.29, lng: 36.82, country: 'Kenya' },
  'Lagos': { lat: 6.45, lng: 3.38, country: 'Nigeria' },
  'Cairo': { lat: 30.04, lng: 31.23, country: 'Egypt' },
  'Jakarta': { lat: -6.21, lng: 106.84, country: 'Indonesia' },
  'Manila': { lat: 14.60, lng: 120.98, country: 'Philippines' },
  'Flint': { lat: 43.01, lng: -83.69, country: 'United States' },
  'New York': { lat: 40.71, lng: -74.00, country: 'United States' },
  'London': { lat: 51.51, lng: -0.12, country: 'United Kingdom' },
  'Tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  'Sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia' },
  'Cape Town': { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brazil' },
  'Paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'Mexico City': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  'Beijing': { lat: 39.9042, lng: 116.4074, country: 'China' },
  'Berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany' },
  'Toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  'Singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  'Lima': { lat: -12.0464, lng: -77.0428, country: 'Peru' },
  'Accra': { lat: 5.6037, lng: -0.1870, country: 'Ghana' },
  'Zurich': { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  'Geneva': { lat: 46.2044, lng: 6.1432, country: 'Switzerland' },
  'Oslo': { lat: 59.9139, lng: 10.7522, country: 'Norway' },
  'Stockholm': { lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  'Copenhagen': { lat: 55.6761, lng: 12.5683, country: 'Denmark' },
  'Amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  'Vienna': { lat: 48.2082, lng: 16.3738, country: 'Austria' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, country: 'United States' },
  'Chicago': { lat: 41.8781, lng: -87.6298, country: 'United States' },
  'Vancouver': { lat: 49.2827, lng: -123.1207, country: 'Canada' },
  'Dublin': { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  'Rome': { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  'Madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
  'Auckland': { lat: -36.8485, lng: 174.7633, country: 'New Zealand' },
  'Helsinki': { lat: 60.1699, lng: 24.9384, country: 'Finland' },
  'Seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  'Shanghai': { lat: 31.2304, lng: 121.4737, country: 'China' },
  'Chongqing': { lat: 29.5630, lng: 106.5516, country: 'China' },
  'Guangzhou': { lat: 23.1291, lng: 113.2644, country: 'China' },
  'Sao Paulo': { lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, country: 'India' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, country: 'India' },
  'Istanbul': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816, country: 'Argentina' },
  'Bogota': { lat: 4.7110, lng: -74.0721, country: 'Colombia' },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
  'Kinshasa': { lat: -4.4419, lng: 15.2663, country: 'DR Congo' },
  'Luanda': { lat: -8.8390, lng: 13.2894, country: 'Angola' },
  'Moscow': { lat: 55.7558, lng: 37.6173, country: 'Russia' },
  'Tehran': { lat: 35.6892, lng: 51.3890, country: 'Iran' },
  'Washington D.C.': { lat: 38.9072, lng: -77.0369, country: 'United States' },
  'San Francisco': { lat: 37.7749, lng: -122.4194, country: 'United States' },
  'Miami': { lat: 25.7617, lng: -80.1918, country: 'United States' },
  'Boston': { lat: 42.3601, lng: -71.0589, country: 'United States' },
  'Seattle': { lat: 47.6062, lng: -122.3321, country: 'United States' },
  'Houston': { lat: 29.7604, lng: -95.3698, country: 'United States' },
  'Edinburgh': { lat: 55.9533, lng: -3.1883, country: 'United Kingdom' },
  'Manchester': { lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
  'Montreal': { lat: 45.5017, lng: -73.5673, country: 'Canada' },
  'Kyoto': { lat: 35.0116, lng: 135.7681, country: 'Japan' },
  'Osaka': { lat: 34.6937, lng: 135.5023, country: 'Japan' },
  'Lyon': { lat: 45.7640, lng: 4.8357, country: 'France' },
  'Marseille': { lat: 43.2965, lng: 5.3698, country: 'France' },
  'Munich': { lat: 48.1351, lng: 11.5820, country: 'Germany' },
  'Frankfurt': { lat: 50.1109, lng: 8.6821, country: 'Germany' },
  'Hamburg': { lat: 53.5511, lng: 9.9937, country: 'Germany' },
  'Milan': { lat: 45.4642, lng: 9.1900, country: 'Italy' },
  'Venice': { lat: 45.4408, lng: 12.3155, country: 'Italy' },
  'Florence': { lat: 43.7696, lng: 11.2558, country: 'Italy' },
  'Barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain' },
  'Seville': { lat: 37.3891, lng: -5.9845, country: 'Spain' },
  'Bern': { lat: 46.9480, lng: 7.4474, country: 'Switzerland' },
  'Rotterdam': { lat: 51.9244, lng: 4.4777, country: 'Netherlands' },
  'Brussels': { lat: 50.8503, lng: 4.3517, country: 'Belgium' },
  'Lisbon': { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  'Porto': { lat: 41.1579, lng: -8.6291, country: 'Portugal' },
  'Athens': { lat: 37.9838, lng: 23.7275, country: 'Greece' },
  'Ankara': { lat: 39.9334, lng: 32.8597, country: 'Turkey' },
  'Johannesburg': { lat: -26.2041, lng: 28.0473, country: 'South Africa' },
  'Brasilia': { lat: -15.7975, lng: -47.8919, country: 'Brazil' },
  'Melbourne': { lat: -37.8136, lng: 144.9631, country: 'Australia' },
  'Brisbane': { lat: -27.4705, lng: 153.0260, country: 'Australia' },
  'Wellington': { lat: -41.2865, lng: 174.7762, country: 'New Zealand' },
  'Shenzhen': { lat: 22.5431, lng: 114.0579, country: 'China' },
  'Chengdu': { lat: 30.5728, lng: 104.0668, country: 'China' },
  'Chennai': { lat: 13.0827, lng: 80.2707, country: 'India' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India' },
  'Pune': { lat: 18.5204, lng: 73.8567, country: 'India' },
  'Alexandria': { lat: 31.2001, lng: 29.9187, country: 'Egypt' },
  'Riyadh': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
  'Dubai': { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates' },
  'Anchorage': { lat: 61.2181, lng: -149.9003, country: 'United States' },
  'Honolulu': { lat: 21.3069, lng: -157.8583, country: 'United States' },
  'Denver': { lat: 39.7392, lng: -104.9903, country: 'United States' },
  'Dallas': { lat: 32.7767, lng: -96.7970, country: 'United States' },
  'Phoenix': { lat: 33.4484, lng: -112.0740, country: 'United States' },
  'Calgary': { lat: 51.0447, lng: -114.0719, country: 'Canada' },
  'Ottawa': { lat: 45.4215, lng: -75.6972, country: 'Canada' },
  'Halifax': { lat: 44.6488, lng: -63.5752, country: 'Canada' },
  'Monterrey': { lat: 25.6866, lng: -100.3161, country: 'Mexico' },
  'Guadalajara': { lat: 20.6597, lng: -103.3496, country: 'Mexico' },
  'San Jose': { lat: 9.9281, lng: -84.0907, country: 'Costa Rica' },
  'Havana': { lat: 23.1136, lng: -82.3666, country: 'Cuba' },
  'Santiago': { lat: -33.4489, lng: -70.6693, country: 'Chile' },
  'Caracas': { lat: 10.4806, lng: -66.9036, country: 'Venezuela' },
  'Quito': { lat: -0.1807, lng: -78.4678, country: 'Ecuador' },
  'La Paz': { lat: -16.4897, lng: -68.1193, country: 'Bolivia' },
  'Asuncion': { lat: -25.2637, lng: -57.5759, country: 'Paraguay' },
  'Montevideo': { lat: -34.9011, lng: -56.1645, country: 'Uruguay' },
  'Manaus': { lat: -3.1190, lng: -60.0217, country: 'Brazil' },
  'Salvador': { lat: -12.9777, lng: -38.5016, country: 'Brazil' },
  'Medellin': { lat: 6.2442, lng: -75.5812, country: 'Colombia' },
  'Guayaquil': { lat: -2.1710, lng: -79.9224, country: 'Ecuador' },
  'Georgetown': { lat: 6.8013, lng: -58.1551, country: 'Guyana' },
  'Paramaribo': { lat: 5.8520, lng: -55.2038, country: 'Suriname' },
  'Reykjavik': { lat: 64.1466, lng: -21.9426, country: 'Iceland' },
  'Warsaw': { lat: 52.2297, lng: 21.0122, country: 'Poland' },
  'Prague': { lat: 50.0755, lng: 14.4378, country: 'Czechia' },
  'Budapest': { lat: 47.4979, lng: 19.0402, country: 'Hungary' },
  'Kiev': { lat: 50.4501, lng: 30.5234, country: 'Ukraine' },
  'Bucharest': { lat: 44.4268, lng: 26.1025, country: 'Romania' },
  'Belgrade': { lat: 44.7872, lng: 20.4573, country: 'Serbia' },
  'Zagreb': { lat: 45.8150, lng: 15.9819, country: 'Croatia' },
  'Sofia': { lat: 42.6977, lng: 23.3219, country: 'Bulgaria' },
  'Belfast': { lat: 54.5973, lng: -5.9301, country: 'United Kingdom' },
  'Glasgow': { lat: 55.8642, lng: -4.2518, country: 'United Kingdom' },
  'Riga': { lat: 56.9496, lng: 24.1052, country: 'Latvia' },
  'Tallinn': { lat: 59.4370, lng: 24.7536, country: 'Estonia' },
  'Vilnius': { lat: 54.6872, lng: 25.2797, country: 'Lithuania' },
  'Bratislava': { lat: 48.1486, lng: 17.1077, country: 'Slovakia' },
  'Addis Ababa': { lat: 9.0192, lng: 38.7469, country: 'Ethiopia' },
  'Dakar': { lat: 14.7167, lng: -17.4677, country: 'Senegal' },
  'Casablanca': { lat: 33.5731, lng: -7.5898, country: 'Morocco' },
  'Algiers': { lat: 36.7538, lng: 3.0588, country: 'Algeria' },
  'Tunis': { lat: 36.8065, lng: 10.1815, country: 'Tunisia' },
  'Khartoum': { lat: 15.5007, lng: 32.5599, country: 'Sudan' },
  'Kampala': { lat: 0.3476, lng: 32.5825, country: 'Uganda' },
  'Harare': { lat: -17.8252, lng: 31.0335, country: 'Zimbabwe' },
  'Lusaka': { lat: -15.4167, lng: 28.2833, country: 'Zambia' },
  'Antananarivo': { lat: -18.8792, lng: 47.5079, country: 'Madagascar' },
  'Abidjan': { lat: 5.3600, lng: -4.0083, country: 'Ivory Coast' },
  'Dar es Salaam': { lat: -6.7924, lng: 39.2083, country: 'Tanzania' },
  'Mogadishu': { lat: 2.0469, lng: 45.3182, country: 'Somalia' },
  'Tripoli': { lat: 32.8872, lng: 13.1913, country: 'Libya' },
  'Windhoek': { lat: -22.5609, lng: 17.0658, country: 'Namibia' },
  'Baghdad': { lat: 33.3128, lng: 44.3615, country: 'Iraq' },
  'Damascus': { lat: 33.5138, lng: 36.2765, country: 'Syria' },
  'Amman': { lat: 31.9454, lng: 35.9284, country: 'Jordan' },
  'Muscat': { lat: 23.5859, lng: 58.4059, country: 'Oman' },
  'Doha': { lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  'Sana\'a': { lat: 15.3694, lng: 44.1910, country: 'Yemen' },
  'Kabul': { lat: 34.5553, lng: 69.2075, country: 'Afghanistan' },
  'Astana': { lat: 51.1605, lng: 71.4704, country: 'Kazakhstan' },
  'Tashkent': { lat: 41.2995, lng: 69.2401, country: 'Uzbekistan' },
  'Novosibirsk': { lat: 55.0084, lng: 82.9357, country: 'Russia' },
  'Vladivostok': { lat: 43.1198, lng: 131.8869, country: 'Russia' },
  'Ulaanbaatar': { lat: 47.8864, lng: 106.9057, country: 'Mongolia' },
  'Baku': { lat: 40.4093, lng: 49.8671, country: 'Azerbaijan' },
  'Tbilisi': { lat: 41.7151, lng: 44.8271, country: 'Georgia' },
  'Yerevan': { lat: 40.1792, lng: 44.5152, country: 'Armenia' },
  'Kuwait City': { lat: 29.3759, lng: 47.9774, country: 'Kuwait' },
  'Manama': { lat: 26.2285, lng: 50.5860, country: 'Bahrain' },
  'Beirut': { lat: 33.8938, lng: 35.5018, country: 'Lebanon' },
  'Kathmandu': { lat: 27.7172, lng: 85.3240, country: 'Nepal' },
  'Colombo': { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
  'Yangon': { lat: 16.8661, lng: 96.1951, country: 'Myanmar' },
  'Phnom Penh': { lat: 11.5564, lng: 104.9282, country: 'Cambodia' },
  'Vientiane': { lat: 17.9757, lng: 102.6331, country: 'Laos' },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  'Taipei': { lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
  'Sapporo': { lat: 43.0621, lng: 141.3544, country: 'Japan' },
  'Fukuoka': { lat: 33.5904, lng: 130.4017, country: 'Japan' },
  'Busan': { lat: 35.1796, lng: 129.0756, country: 'South Korea' },
  'Tianjin': { lat: 39.3434, lng: 117.3616, country: 'China' },
  'Wuhan': { lat: 30.5928, lng: 114.3055, country: 'China' },
  'Xian': { lat: 34.3416, lng: 108.9398, country: 'China' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, country: 'India' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, country: 'India' },
  'Multan': { lat: 30.1575, lng: 71.5249, country: 'Pakistan' },
  'Faisalabad': { lat: 31.4504, lng: 73.1350, country: 'Pakistan' },
  'Rawalpindi': { lat: 33.5651, lng: 73.0169, country: 'Pakistan' },
  'Gujranwala': { lat: 32.1617, lng: 74.1883, country: 'Pakistan' },
  'Chittagong': { lat: 22.3569, lng: 91.7832, country: 'Bangladesh' },
  'Perth': { lat: -31.9505, lng: 115.8605, country: 'Australia' },
  'Adelaide': { lat: -34.9285, lng: 138.6007, country: 'Australia' },
  'Hobart': { lat: -42.8821, lng: 147.3272, country: 'Australia' },
  'Darwin': { lat: -12.4634, lng: 130.8456, country: 'Australia' },
  'Port Moresby': { lat: -9.4438, lng: 147.1803, country: 'Papua New Guinea' },
  'Suva': { lat: -18.1248, lng: 178.4501, country: 'Fiji' },
  'Apia': { lat: -13.8333, lng: -171.7667, country: 'Samoa' },
  'Nuku\'alofa': { lat: -21.1394, lng: -175.2049, country: 'Tonga' },
  'Noumea': { lat: -22.2735, lng: 166.4473, country: 'New Caledonia' },
  'Pisa': { lat: 43.7228, lng: 10.4017, country: 'Italy' },
  'Amalfi': { lat: 40.6331, lng: 14.6028, country: 'Italy' },
  'Sorrento': { lat: 40.6263, lng: 14.3758, country: 'Italy' },
  'Capri': { lat: 40.5518, lng: 14.2443, country: 'Italy' },
  'Nice': { lat: 43.7102, lng: 7.262, country: 'France' },
  'Cannes': { lat: 43.5513, lng: 7.0128, country: 'France' },
  'Chamonix': { lat: 45.9227, lng: 6.8685, country: 'France' },
  'Strasbourg': { lat: 48.5734, lng: 7.7521, country: 'France' },
  'Bordeaux': { lat: 44.8378, lng: -0.5792, country: 'France' },
  'Granada': { lat: 37.1773, lng: -3.5986, country: 'Spain' },
  'Valencia': { lat: 39.4699, lng: -0.3763, country: 'Spain' },
  'Ibiza': { lat: 38.9067, lng: 1.4206, country: 'Spain' },
  'Mallorca': { lat: 39.6953, lng: 3.0176, country: 'Spain' },
  'Sintra': { lat: 38.7984, lng: -9.3882, country: 'Portugal' },
  'Faro': { lat: 37.0179, lng: -7.9308, country: 'Portugal' },
  'Funchal': { lat: 32.6669, lng: -16.9241, country: 'Portugal' },
  'Mykonos': { lat: 37.4467, lng: 25.3289, country: 'Greece' },
  'Santorini': { lat: 36.3932, lng: 25.4615, country: 'Greece' },
  'Rhodes': { lat: 36.4341, lng: 28.2176, country: 'Greece' },
  'Crete': { lat: 35.2401, lng: 24.8093, country: 'Greece' },
  'Dubrovnik': { lat: 42.6507, lng: 18.0944, country: 'Croatia' },
  'Split': { lat: 43.5081, lng: 16.4402, country: 'Croatia' },
  'Hvar': { lat: 43.1729, lng: 16.4427, country: 'Croatia' },
  'Salzburg': { lat: 47.8095, lng: 13.055, country: 'Austria' },
  'Innsbruck': { lat: 47.2692, lng: 11.4041, country: 'Austria' },
  'Hallstatt': { lat: 47.5622, lng: 13.6493, country: 'Austria' },
  'Lucerne': { lat: 47.0502, lng: 8.3093, country: 'Switzerland' },
  'Interlaken': { lat: 46.6863, lng: 7.8632, country: 'Switzerland' },
  'Zermatt': { lat: 46.0207, lng: 7.7491, country: 'Switzerland' },
  'St. Moritz': { lat: 46.4908, lng: 9.8355, country: 'Switzerland' },
  'Rothenburg': { lat: 49.3772, lng: 10.1789, country: 'Germany' },
  'Heidelberg': { lat: 49.3988, lng: 8.6724, country: 'Germany' },
  'Cologne': { lat: 50.9375, lng: 6.9603, country: 'Germany' },
  'Utrecht': { lat: 52.0907, lng: 5.1214, country: 'Netherlands' },
  'Haarlem': { lat: 52.3874, lng: 4.6462, country: 'Netherlands' },
  'Bruges': { lat: 51.2093, lng: 3.2247, country: 'Belgium' },
  'Ghent': { lat: 51.0543, lng: 3.7174, country: 'Belgium' },
  'Akureyri': { lat: 65.6835, lng: -18.0878, country: 'Iceland' },
  'Inverness': { lat: 57.4778, lng: -4.2247, country: 'United Kingdom' },
  'Isle of Skye': { lat: 57.4124, lng: -6.1963, country: 'United Kingdom' },
  'Bath': { lat: 51.3758, lng: -2.3599, country: 'United Kingdom' },
  'York': { lat: 53.9599, lng: -1.0873, country: 'United Kingdom' },
  'Oxford': { lat: 51.752, lng: -1.2577, country: 'United Kingdom' },
  'Cambridge': { lat: 52.2053, lng: 0.1218, country: 'United Kingdom' },
  'Krakow': { lat: 50.0647, lng: 19.945, country: 'Poland' },
  'Zakopane': { lat: 49.2992, lng: 19.9495, country: 'Poland' },
  'Brasov': { lat: 45.658, lng: 25.6012, country: 'Romania' },
  'Bansko': { lat: 41.8383, lng: 23.4885, country: 'Bulgaria' },
  'Kotor': { lat: 42.4247, lng: 18.7712, country: 'Montenegro' },
  'Budva': { lat: 42.2912, lng: 18.8403, country: 'Montenegro' },
  'Las Vegas': { lat: 36.1716, lng: -115.1398, country: 'United States' },
  'Orlando': { lat: 28.5383, lng: -81.3792, country: 'United States' },
  'Key West': { lat: 24.5551, lng: -81.78, country: 'United States' },
  'Maui': { lat: 20.7984, lng: -156.3319, country: 'United States' },
  'Kauai': { lat: 22.0964, lng: -159.5261, country: 'United States' },
  'Juneau': { lat: 58.3019, lng: -134.4197, country: 'United States' },
  'Aspen': { lat: 39.1911, lng: -106.8175, country: 'United States' },
  'Grand Canyon': { lat: 36.0544, lng: -112.1376, country: 'United States' },
  'Yosemite': { lat: 37.8651, lng: -119.5383, country: 'United States' },
  'Niagara Falls': { lat: 43.0896, lng: -79.0849, country: 'Canada' },
  'Banff': { lat: 51.1784, lng: -115.5708, country: 'Canada' },
  'Whistler': { lat: 50.1163, lng: -122.9574, country: 'Canada' },
  'Victoria': { lat: 48.4284, lng: -123.3656, country: 'Canada' },
  'Quebec City': { lat: 46.8139, lng: -71.2082, country: 'Canada' },
  'Cancun': { lat: 21.1619, lng: -86.8515, country: 'Mexico' },
  'Cabo San Lucas': { lat: 22.8905, lng: -109.9167, country: 'Mexico' },
  'Tulum': { lat: 20.2114, lng: -87.4658, country: 'Mexico' },
  'Cozumel': { lat: 20.423, lng: -86.9223, country: 'Mexico' },
  'Playa del Carmen': { lat: 20.6296, lng: -87.0739, country: 'Mexico' },
  'Puerto Vallarta': { lat: 20.6534, lng: -105.2253, country: 'Mexico' },
  'Oaxaca': { lat: 17.0732, lng: -96.7266, country: 'Mexico' },
  'San Miguel de Allende': { lat: 20.9139, lng: -100.7439, country: 'Mexico' },
  'Varadero': { lat: 23.1536, lng: -81.2514, country: 'Cuba' },
  'Nassau': { lat: 25.0475, lng: -77.3554, country: 'Bahamas' },
  'Punta Cana': { lat: 18.5601, lng: -68.3725, country: 'Dominican Republic' },
  'Montego Bay': { lat: 18.4762, lng: -77.8939, country: 'Jamaica' },
  'San Juan': { lat: 18.4655, lng: -66.118, country: 'Puerto Rico' },
  'Cusco': { lat: -13.5319, lng: -71.9675, country: 'Peru' },
  'Machu Picchu': { lat: -13.1631, lng: -72.545, country: 'Peru' },
  'Cartagena': { lat: 10.391, lng: -75.4794, country: 'Colombia' },
  'Galapagos': { lat: -0.9538, lng: -90.9656, country: 'Ecuador' },
  'Bariloche': { lat: -41.1335, lng: -71.3103, country: 'Argentina' },
  'Mendoza': { lat: -32.8895, lng: -68.8458, country: 'Argentina' },
  'Ushuaia': { lat: -54.8019, lng: -68.303, country: 'Argentina' },
  'Florianopolis': { lat: -27.5954, lng: -48.548, country: 'Brazil' },
  'Buzios': { lat: -22.756, lng: -41.8884, country: 'Brazil' },
  'Foz do Iguacu': { lat: -25.5469, lng: -54.5882, country: 'Brazil' },
  'Nara': { lat: 34.6851, lng: 135.8048, country: 'Japan' },
  'Hiroshima': { lat: 34.3853, lng: 132.4553, country: 'Japan' },
  'Okinawa': { lat: 26.2124, lng: 127.6809, country: 'Japan' },
  'Hakone': { lat: 35.1852, lng: 139.0258, country: 'Japan' },
  'Nikko': { lat: 36.748, lng: 139.6102, country: 'Japan' },
  'Kobe': { lat: 34.6901, lng: 135.1955, country: 'Japan' },
  'Takayama': { lat: 36.1408, lng: 137.2522, country: 'Japan' },
  'Kamakura': { lat: 35.3192, lng: 139.5467, country: 'Japan' },
  'Himeji': { lat: 34.8151, lng: 134.6853, country: 'Japan' },
  'Beppu': { lat: 33.2842, lng: 131.4907, country: 'Japan' },
  'Phuket': { lat: 7.8804, lng: 98.3922, country: 'Thailand' },
  'Pattaya': { lat: 12.9236, lng: 100.8824, country: 'Thailand' },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853, country: 'Thailand' },
  'Krabi': { lat: 8.0863, lng: 98.9063, country: 'Thailand' },
  'Koh Samui': { lat: 9.512, lng: 100.0136, country: 'Thailand' },
  'Hua Hin': { lat: 12.5684, lng: 99.9576, country: 'Thailand' },
  'Ayutthaya': { lat: 14.3532, lng: 100.5681, country: 'Thailand' },
  'Siem Reap': { lat: 13.3633, lng: 103.8564, country: 'Cambodia' },
  'Luang Prabang': { lat: 19.8833, lng: 102.1347, country: 'Laos' },
  'Bali': { lat: -8.4095, lng: 115.1889, country: 'Indonesia' },
  'Ubud': { lat: -8.5069, lng: 115.2625, country: 'Indonesia' },
  'Lombok': { lat: -8.65, lng: 116.35, country: 'Indonesia' },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695, country: 'Indonesia' },
  'Penang': { lat: 5.4141, lng: 100.3288, country: 'Malaysia' },
  'Langkawi': { lat: 6.35, lng: 99.8, country: 'Malaysia' },
  'Melaka': { lat: 2.1896, lng: 102.2501, country: 'Malaysia' },
  'Boracay': { lat: 11.9719, lng: 121.9247, country: 'Philippines' },
  'El Nido': { lat: 11.1766, lng: 119.389, country: 'Philippines' },
  'Cebu': { lat: 10.3157, lng: 123.8854, country: 'Philippines' },
  'Borocay': { lat: 11.9674, lng: 121.9248, country: 'Philippines' },
  'Hanoi': { lat: 21.0285, lng: 105.8542, country: 'Vietnam' },
  'Halong Bay': { lat: 20.9599, lng: 107.0425, country: 'Vietnam' },
  'Da Nang': { lat: 16.0544, lng: 108.2022, country: 'Vietnam' },
  'Hoi An': { lat: 15.8801, lng: 108.338, country: 'Vietnam' },
  'Nha Trang': { lat: 12.2388, lng: 109.1967, country: 'Vietnam' },
  'Phu Quoc': { lat: 10.282, lng: 103.9563, country: 'Vietnam' },
  'Bagan': { lat: 21.1717, lng: 94.86, country: 'Myanmar' },
  'Inle Lake': { lat: 20.5894, lng: 96.9302, country: 'Myanmar' },
  'Pokhara': { lat: 28.2096, lng: 83.9856, country: 'Nepal' },
  'Male': { lat: 4.1755, lng: 73.5093, country: 'Maldives' },
  'Maafushi': { lat: 3.9439, lng: 73.4897, country: 'Maldives' },
  'Kandy': { lat: 7.2906, lng: 80.6337, country: 'Sri Lanka' },
  'Galle': { lat: 6.0535, lng: 80.2176, country: 'Sri Lanka' },
  'Sigiriya': { lat: 7.957, lng: 80.7603, country: 'Sri Lanka' },
  'Bora Bora': { lat: -16.5004, lng: -151.7415, country: 'French Polynesia' },
  'Tahiti': { lat: -17.6509, lng: -149.426, country: 'French Polynesia' },
  'Moorea': { lat: -17.5388, lng: -149.8294, country: 'French Polynesia' },
  'Rarotonga': { lat: -21.2333, lng: -159.7833, country: 'Cook Islands' },
  'Marrakech': { lat: 31.6295, lng: -7.9811, country: 'Morocco' },
  'Essaouira': { lat: 31.5125, lng: -9.77, country: 'Morocco' },
  'Agadir': { lat: 30.4278, lng: -9.5981, country: 'Morocco' },
  'Luxor': { lat: 25.6872, lng: 32.6396, country: 'Egypt' },
  'Aswan': { lat: 24.0889, lng: 32.8998, country: 'Egypt' },
  'Sharm El Sheikh': { lat: 27.9158, lng: 34.3299, country: 'Egypt' },
  'Hurghada': { lat: 27.2579, lng: 33.8116, country: 'Egypt' },
  'Giza': { lat: 29.9765, lng: 31.1313, country: 'Egypt' },
  'Zanzibar': { lat: -6.1659, lng: 39.199, country: 'Tanzania' },
  'Stone Town': { lat: -6.16, lng: 39.19, country: 'Tanzania' },
  'Mahe': { lat: -4.6796, lng: 55.492, country: 'Seychelles' },
  'Praslin': { lat: -4.3167, lng: 55.7333, country: 'Seychelles' },
  'Port Louis': { lat: -20.1609, lng: 57.5012, country: 'Mauritius' },
  'Kruger Park': { lat: -23.9884, lng: 31.5547, country: 'South Africa' },
  'Stellenbosch': { lat: -33.9321, lng: 18.8602, country: 'South Africa' },
  'Sun City': { lat: -25.3402, lng: 27.0984, country: 'South Africa' },
  'Victoria Falls': { lat: -17.9244, lng: 25.8572, country: 'Zimbabwe' },
  'Cappadocia': { lat: 38.6431, lng: 34.8289, country: 'Turkey' },
  'Antalya': { lat: 36.8841, lng: 30.7056, country: 'Turkey' },
  'Bodrum': { lat: 37.0344, lng: 27.4305, country: 'Turkey' },
  'Izmir': { lat: 38.4237, lng: 27.1428, country: 'Turkey' },
  'Ephesus': { lat: 37.9391, lng: 27.3414, country: 'Turkey' },
  'Fethiye': { lat: 36.6219, lng: 29.1164, country: 'Turkey' },
  'Cairns': { lat: -16.9186, lng: 145.7781, country: 'Australia' },
  'Port Douglas': { lat: -16.4842, lng: 145.4619, country: 'Australia' },
  'Gold Coast': { lat: -28.0167, lng: 153.4, country: 'Australia' },
  'Byron Bay': { lat: -28.6474, lng: 153.612, country: 'Australia' },
  'Broome': { lat: -17.9614, lng: 122.2359, country: 'Australia' },
  'Alice Springs': { lat: -23.698, lng: 133.8807, country: 'Australia' },
  'Uluru': { lat: -25.3444, lng: 131.0369, country: 'Australia' },
  'Queenstown': { lat: -45.0312, lng: 168.6626, country: 'New Zealand' },
  'Rotorua': { lat: -38.1368, lng: 176.2497, country: 'New Zealand' },
  'Christchurch': { lat: -43.5321, lng: 172.6362, country: 'New Zealand' },
  'Milford Sound': { lat: -44.6414, lng: 167.8974, country: 'New Zealand' },
  'Nadi': { lat: -17.7765, lng: 177.415, country: 'Fiji' },
  'San Sebastian': { lat: 43.3183, lng: -1.9812, country: 'Spain' },
  'Toledo': { lat: 39.8628, lng: -4.0273, country: 'Spain' },
  'Algarve': { lat: 37.1362, lng: -8.2255, country: 'Portugal' },
  'Rhodes Town': { lat: 36.4452, lng: 28.2278, country: 'Greece' },
  'Corfu': { lat: 39.6243, lng: 19.9217, country: 'Greece' },
  'Zadar': { lat: 44.1194, lng: 15.2314, country: 'Croatia' },
  'Plitvice': { lat: 44.8806, lng: 15.6162, country: 'Croatia' },
  'Cesky Krumlov': { lat: 48.8127, lng: 14.314, country: 'Czechia' },
  'Salzburg Town': { lat: 47.8095, lng: 13.0551, country: 'Austria' },
  'Grindelwald': { lat: 46.6242, lng: 8.0414, country: 'Switzerland' },
  'Lauterbrunnen': { lat: 46.5935, lng: 7.9091, country: 'Switzerland' },
  'Rothenburg ob der Tauber': { lat: 49.3773, lng: 10.1788, country: 'Germany' },
  'Haarlem Town': { lat: 52.3875, lng: 4.6461, country: 'Netherlands' },
  'Isle of Wight': { lat: 50.6938, lng: -1.3047, country: 'United Kingdom' },
  'Windsor': { lat: 51.4843, lng: -0.6044, country: 'United Kingdom' },
  'Krakow Old Town': { lat: 50.0646, lng: 19.9449, country: 'Poland' },
  'Bled': { lat: 46.3683, lng: 14.1143, country: 'Slovenia' },
  'Ljubljana': { lat: 46.0569, lng: 14.5058, country: 'Slovenia' },
  'Mostar': { lat: 43.3438, lng: 17.8078, country: 'Bosnia and Herzegovina' },
  'Sarajevo': { lat: 43.8563, lng: 18.4131, country: 'Bosnia and Herzegovina' },
  'Ohrid': { lat: 41.1172, lng: 20.8016, country: 'North Macedonia' },
  'Tirana': { lat: 41.3275, lng: 19.8187, country: 'Albania' },
  'Budapest Castle': { lat: 47.4962, lng: 19.0396, country: 'Hungary' },
  'Tulum Beach': { lat: 20.2115, lng: -87.4659, country: 'Mexico' },
  'Guanajuato': { lat: 21.019, lng: -101.2574, country: 'Mexico' },
  'Varadero Beach': { lat: 23.1537, lng: -81.2515, country: 'Cuba' },
  'Cusco Plaza': { lat: -13.532, lng: -71.9676, country: 'Peru' },
  'Iguazu Falls': { lat: -25.6953, lng: -54.4367, country: 'Argentina' },
  'Arequipa White City': { lat: -16.409, lng: -71.5375, country: 'Peru' },
  'Quito Old Town': { lat: -0.1808, lng: -78.4679, country: 'Ecuador' }
};

// Refined, stylized landmass outlines for a beautiful minimalist map
const MAP_LANDMASS_PATHS = [
  // North America (including Alaska & Canada)
  "M70,55 L90,45 L115,40 L165,35 L200,35 L230,35 L245,45 L255,40 L275,38 L285,45 L280,55 L260,65 L275,80 L270,95 L250,110 L240,115 L238,135 L228,140 L220,135 L215,115 L205,110 L195,115 L180,105 L150,115 L135,100 L115,105 L105,95 L75,95 L65,80 L70,70 Z",
  
  // South America
  "M215,145 L245,140 L275,145 L300,165 L315,190 L305,225 L285,255 L260,285 L245,295 L242,285 L250,260 L240,225 L215,190 Z",
  
  // Greenland
  "M245,20 L270,18 L295,20 L285,38 L265,40 L250,30 Z",
  
  // Europe & Asia (Eurasia) with distinct Arabian, Indian, and SE Asian Peninsulas
  "M335,65 L350,55 L375,45 L410,40 L445,40 L495,42 L550,45 L625,48 L685,48 L715,50 L735,55 L755,62 L760,75 L745,85 L750,95 L740,105 L745,115 L738,125 L718,125 L712,135 L700,122 L682,130 L665,155 L650,158 L635,145 L625,155 L615,150 L605,155 L590,140 L575,150 L565,142 L555,158 L545,150 L538,162 L525,158 L515,145 L490,148 L498,155 L518,162 L525,148 L532,145 L550,152 L565,175 L578,155 L582,145 L610,152 L625,178 L635,155 L648,152 L665,155 L685,130 L700,122 L718,125 L738,125 L745,115 L740,105 L750,95 L745,85 L760,75 L755,62 L735,55 L715,50 L685,48 L625,48 L550,45 L495,42 L445,40 L410,40 L375,45 L350,55 L335,65 Z",
  
  // Africa
  "M375,115 L398,110 L418,112 L438,112 L455,122 L465,135 L480,152 L485,175 L482,195 L472,215 L458,235 L445,255 L435,265 L430,265 L425,255 L422,232 L418,212 L408,198 L398,192 L388,185 L372,175 L368,162 L368,150 L365,138 L370,122 Z",
  
  // Australia
  "M648,225 L652,215 L672,205 L692,208 L712,212 L718,225 L715,245 L705,252 L685,255 L662,250 L648,238 Z",
  
  // Great Britain & Ireland
  "M390,70 L405,68 L408,76 L398,88 L392,84 Z",
  "M382,76 L388,74 L386,82 L380,80 Z",
  
  // Japan
  "M728,105 L738,112 L735,125 L726,132 L728,120 Z",
  
  // Madagascar
  "M482,218 L488,215 L492,228 L485,238 L480,228 Z",
  
  // New Zealand
  "M725,268 L732,278 L728,285 L722,275 Z",

  // Iceland
  "M295,52 L308,50 L312,56 L302,62 L292,58 Z",
  
  // Cuba & Caribbean
  "M185,128 L198,126 L205,130 L192,132 Z",
  "M210,132 L218,131 L216,136 L208,135 Z",
  
  // Sri Lanka
  "M514,168 L518,168 L519,174 L514,176 Z",
  
  // Taiwan
  "M678,131 L683,130 L681,138 L677,136 Z",
  
  // Tasmania
  "M682,260 L690,260 L688,268 L680,266 Z",

  // Sumatra, Java, Borneo (Indonesia)
  "M596,178 L612,185 L605,192 L590,182 Z",
  "M612,192 L632,195 L628,199 L608,195 Z",
  "M618,172 L635,175 L632,188 L618,184 Z"
];

export const WorldMap: React.FC<WorldMapProps> = ({ onCitySelected }) => {
  const t = useT();

  const [selectedCity, setSelectedCity] = useState<CityWaterData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Zoom and Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filtering states
  const [safetyFilter, setSafetyFilter] = useState<'ALL' | 'SAFE' | 'CAUTION' | 'UNSAFE'>('ALL');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Coordinate tracking state
  const [hoveredGeoCoords, setHoveredGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // SVG dimensions
  const mapWidth = 800;
  const mapHeight = 400;

  // Project longitude & latitude into 2D SVG canvas space
  const projectCoords = (lat: number, lng: number) => {
    // Equirectangular projection
    const x = ((lng + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  // Compute Lat/Lng under mouse pointer relative to pan and zoom
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleMouseMove(e);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const svgX = ((e.clientX - rect.left) / rect.width) * mapWidth;
    const svgY = ((e.clientY - rect.top) / rect.height) * mapHeight;

    // Adjust for current pan and zoom
    const mapX = (svgX - pan.x) / zoom;
    const mapY = (svgY - pan.y) / zoom;

    // Convert back to Lat/Lng
    const lng = (mapX / mapWidth) * 360 - 180;
    const lat = 90 - (mapY / mapHeight) * 180;

    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setHoveredGeoCoords({ lat, lng });
    } else {
      setHoveredGeoCoords(null);
    }
  };

  const centerOnCity = (lat: number, lng: number) => {
    const pos = projectCoords(lat, lng);
    const targetZoom = 2.5;
    // Center point on SVG canvas is (400, 200)
    const targetPanX = 400 - pos.x * targetZoom;
    const targetPanY = 200 - pos.y * targetZoom;

    // Clamp pan based on targetZoom
    const maxX = Math.max(0, (targetZoom - 1) * mapWidth);
    const maxY = Math.max(0, (targetZoom - 1) * mapHeight);

    setZoom(targetZoom);
    setPan({
      x: Math.max(-maxX, Math.min(0, targetPanX)),
      y: Math.max(-maxY, Math.min(0, targetPanY))
    });
  };

  const handleMarkerClick = (cityName: string, countryName: string, lat: number, lng: number) => {
    const lookup = getCityData(countryName, cityName);
    if (lookup.found) {
      setSelectedCity(lookup.data);
      centerOnCity(lat, lng);
    }
  };

  const closePanel = () => {
    setSelectedCity(null);
  };

  // Zoom controls handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(8, prev * 1.4));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = prev / 1.4;
      if (next <= 1.05) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan dragging handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;

    const maxX = Math.max(0, (zoom - 1) * mapWidth);
    const maxY = Math.max(0, (zoom - 1) * mapHeight);

    setPan({
      x: Math.max(-maxX, Math.min(0, rawX)),
      y: Math.max(-maxY, Math.min(0, rawY))
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Pan dragging handlers (Touch for Mobile)
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStart.x;
    const rawY = touch.clientY - dragStart.y;

    const maxX = Math.max(0, (zoom - 1) * mapWidth);
    const maxY = Math.max(0, (zoom - 1) * mapHeight);

    setPan({
      x: Math.max(-maxX, Math.min(0, rawX)),
      y: Math.max(-maxY, Math.min(0, rawY))
    });
  };

  // Filter condition helper
  const isCityVisible = (score: number) => {
    if (safetyFilter === 'ALL') return true;
    if (safetyFilter === 'SAFE') return score >= 8;
    if (safetyFilter === 'CAUTION') return score >= 4 && score <= 7;
    if (safetyFilter === 'UNSAFE') return score <= 3;
    return true;
  };

  // Compile list of searchable cities from coordinates
  const allCitiesList = Object.keys(CITY_COORDS).map(name => {
    const coords = CITY_COORDS[name];
    const lookup = getCityData(coords.country, name);
    return {
      name,
      country: coords.country,
      lat: coords.lat,
      lng: coords.lng,
      score: lookup.found ? lookup.data.safety_score : 10
    };
  });

  // Filter search results
  const searchResults = searchQuery.trim() === ''
    ? []
    : allCitiesList.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const handleSearchResultClick = (city: typeof allCitiesList[0]) => {
    setSearchQuery('');
    setShowSearchResults(false);
    centerOnCity(city.lat, city.lng);
    const lookup = getCityData(city.country, city.name);
    if (lookup.found) {
      setSelectedCity(lookup.data);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden" id="world-map-wrapper">
      
      {/* MAP HEADER */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="map-header">
        <div>
          <h3 className="text-sm font-bold text-slate-200 tracking-wide font-title">{t('map.title')}</h3>
          <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
            {t('map.subtitle', { n: Object.keys(CITY_COORDS).length })}
          </p>
        </div>
        <div className="bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold text-blue-400 tracking-wider flex items-center gap-2 shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span>CURSOR:</span>
          {hoveredGeoCoords ? (
            <span className="text-blue-400 font-black font-mono">
              {Math.abs(hoveredGeoCoords.lat).toFixed(4)}°{hoveredGeoCoords.lat >= 0 ? 'N' : 'S'}, {Math.abs(hoveredGeoCoords.lng).toFixed(4)}°{hoveredGeoCoords.lng >= 0 ? 'E' : 'W'}
            </span>
          ) : (
            <span className="text-slate-500 tracking-wider">ACQUIRING...</span>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL ROW */}
      <div className="p-4 bg-slate-900/20 border-b border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between" id="map-controls-row">
        
        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto" id="safety-score-filters">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-1.5 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter safety:</span>
          </span>
          <button
            onClick={() => setSafetyFilter('ALL')}
            className={`px-3 py-1 text-[10.5px] font-bold rounded-full transition-all duration-200 cursor-pointer ${
              safetyFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Cities
          </button>
          <button
            onClick={() => setSafetyFilter('SAFE')}
            className={`px-3 py-1 text-[10.5px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              safetyFilter === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-slate-900 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 border border-slate-800/80'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Safe (8-10)
          </button>
          <button
            onClick={() => setSafetyFilter('CAUTION')}
            className={`px-3 py-1 text-[10.5px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              safetyFilter === 'CAUTION'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'bg-slate-900 text-amber-500 hover:text-amber-400 hover:bg-slate-800 border border-slate-800/80'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Caution (4-7)
          </button>
          <button
            onClick={() => setSafetyFilter('UNSAFE')}
            className={`px-3 py-1 text-[10.5px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              safetyFilter === 'UNSAFE'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'bg-slate-900 text-rose-500 hover:text-rose-400 hover:bg-slate-800 border border-slate-800/80'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Unsafe (1-3)
          </button>
        </div>

        {/* Dynamic Map Search Box */}
        <div className="relative w-full md:w-64" id="map-search-container">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => {
              setTimeout(() => setShowSearchResults(false), 200);
            }}
            placeholder="Search city or country on map..."
            className="w-full bg-slate-900 border border-slate-800/85 focus:border-blue-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-500 font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Search Dropdown Panel */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.name}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-xs flex justify-between items-center transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{result.name}</span>
                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{result.country}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono text-white" style={{ backgroundColor: getScoreColors(result.score || 10).hex }}>
                    {result.score}/10
                  </span>
                </button>
              ))}
            </div>
          )}
          {showSearchResults && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 text-center text-slate-500 text-xs font-medium">
              No cities found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>



      {/* SVG CANVAS CONTAINER */}
      <div className="relative w-full aspect-[1.4/1] sm:aspect-[2/1] select-none" id="map-svg-canvas">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={() => {
            handleMouseUpOrLeave();
            setHoveredGeoCoords(null);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => {
            handleMouseUpOrLeave();
            setHoveredGeoCoords(null);
          }}
          className={`w-full h-full bg-slate-950 transition-all duration-300 ${
            isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
        >
          <defs>
            {/* Smooth linear gradient for premium landmass colors */}
            <linearGradient id="landmass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            
            {/* Gentle landmass backing drop shadow for visual depth */}
            <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="3.5" floodColor="#3b82f6" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Inner zoomable / pannable content group */}
          <g 
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} 
            className={isDragging ? "" : "transition-transform duration-300 ease-out"}
          >
            {/* Fine Grid Overlay (Longitudes/Latitudes) */}
            <g className="stroke-slate-900/40" strokeWidth="0.5" strokeDasharray="3 4">
              {Array.from({ length: 15 }).map((_, i) => {
                const x = (mapWidth / 16) * (i + 1);
                return <line key={`v-${i}`} x1={x} y1="0" x2={x} y2={mapHeight} />;
              })}
              {Array.from({ length: 7 }).map((_, i) => {
                const y = (mapHeight / 8) * (i + 1);
                return <line key={`h-${i}`} x1="0" y1={y} x2={mapWidth} y2={y} />;
              })}
            </g>

            {/* Scientific Navigation Reference Circles & Lines */}
            <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.6">
              {/* Equator (lat = 0) -> y = 200 */}
              <line x1="0" y1="200" x2={mapWidth} y2="200" />
              {/* Prime Meridian (lng = 0) -> x = 400 */}
              <line x1="400" y1="0" x2="400" y2={mapHeight} />
              {/* Tropic of Cancer (lat = 23.5) -> y = 200 - (23.5 / 180) * 400 = 147.8 */}
              <line x1="0" y1="147.8" x2={mapWidth} y2="147.8" />
              {/* Tropic of Capricorn (lat = -23.5) -> y = 200 + (23.5 / 180) * 400 = 252.2 */}
              <line x1="0" y1="252.2" x2={mapWidth} y2="252.2" />
            </g>

            {/* Reference Line Typography Labels */}
            <g fill="#475569" fontSize="6.5" fontFamily="monospace" opacity="0.7">
              <text x="5" y="196">EQUATOR 0°</text>
              <text x="404" y="10">PRIME MERIDIAN 0°</text>
              <text x="5" y="144" className="hidden sm:block">TROPIC OF CANCER 23.5° N</text>
              <text x="5" y="248" className="hidden sm:block">TROPIC OF CAPRICORN 23.5° S</text>
            </g>

            {/* Decorative Compass Rose (Top Right Area, approx 720, 60) */}
            <g transform="translate(735, 65)" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.45" className="hidden md:block">
              <circle cx="0" cy="0" r="16" strokeDasharray="1 2" />
              <circle cx="0" cy="0" r="12" />
              <line x1="-20" y1="0" x2="20" y2="0" />
              <line x1="0" y1="-20" x2="0" y2="20" />
              <polygon points="0,-18 3,-4 0,0" fill="#475569" stroke="none" />
              <polygon points="0,-18 -3,-4 0,0" fill="#334155" stroke="none" />
              <polygon points="0,18 3,4 0,0" fill="#334155" stroke="none" />
              <polygon points="0,18 -3,4 0,0" fill="#475569" stroke="none" />
              <polygon points="18,0 4,3 0,0" fill="#475569" stroke="none" />
              <polygon points="18,0 4,-3 0,0" fill="#334155" stroke="none" />
              <polygon points="-18,0 -4,3 0,0" fill="#334155" stroke="none" />
              <polygon points="-18,0 -4,-3 0,0" fill="#475569" stroke="none" />
              <text x="-2.5" y="-22" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#64748b">N</text>
            </g>

            {/* Stylized detailed landmass shapes with high quality gradient fill and subtle drop shadow */}
            <g fill="url(#landmass-gradient)" stroke="#272d3d" strokeWidth="0.8" strokeLinejoin="round" filter="url(#glow-shadow)">
              {MAP_LANDMASS_PATHS.map((path, idx) => (
                <path 
                  key={idx} 
                  d={path} 
                  className="transition-colors duration-300 hover:fill-slate-800/60" 
                />
              ))}
            </g>

            {/* Map city markers */}
            {Object.entries(CITY_COORDS).map(([name, coords]) => {
              const pos = projectCoords(coords.lat, coords.lng);
              const lookup = getCityData(coords.country, name);
              if (!lookup.found) return null;

              const cityData = lookup.data;
              const colors = getScoreColors(cityData.safety_score);
              const isHovered = hoveredCity === name;
              const isSelected = selectedCity?.city === name;
              const isFilteredVisible = isCityVisible(cityData.safety_score);

              return (
                <g
                  key={name}
                  id={`marker-${name}`}
                  className={`transition-all duration-300 ${
                    isFilteredVisible ? "cursor-pointer" : "pointer-events-none"
                  }`}
                  opacity={isFilteredVisible ? 1 : 0.15}
                  onClick={() => handleMarkerClick(name, coords.country, coords.lat, coords.lng)}
                  onMouseEnter={() => isFilteredVisible && setHoveredCity(name)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Selected / Hovered Solid ring highlight */}
                  {isSelected && isFilteredVisible && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={9}
                      fill="none"
                      stroke={colors.hex}
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                  )}
                  {isHovered && !isSelected && isFilteredVisible && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={8}
                      fill="none"
                      stroke={colors.hex}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}

                  {/* Core active marker dot */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? 7 : isSelected ? 7.5 : 4.5}
                    fill={colors.hex}
                    stroke="#ffffff"
                    strokeWidth={isHovered || isSelected ? 2 : 1}
                    className="transition-all duration-300 shadow-lg"
                  />

                  {/* Clean micro hover tooltip */}
                  {isHovered && isFilteredVisible && (
                    <g transform={`translate(${pos.x}, ${pos.y - 12})`} className="pointer-events-none z-30">
                      <rect
                        x="-55"
                        y="-20"
                        width="110"
                        height="20"
                        rx="6"
                        fill="#090d16"
                        stroke="#1e293b"
                        strokeWidth="1"
                        className="shadow-xl"
                      />
                      <text
                        textAnchor="middle"
                        y="-7"
                        fill="#f8fafc"
                        fontSize="9.5"
                        fontWeight="bold"
                        className="font-sans"
                      >
                        {name} ({cityData.safety_score}/10)
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* FLOATING CORNER LEGEND (Left) */}
        <div id="map-legend" className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3.5 shadow-xl max-w-[55%] sm:max-w-none">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider hidden sm:inline">
            {t('map.legendTitle')}:
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30 shrink-0" />
              <span className="truncate">{t('map.legendSafe')}</span>
            </span>
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30 shrink-0" />
              <span className="truncate">{t('map.legendCaution')}</span>
            </span>
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30 shrink-0" />
              <span className="truncate">{t('map.legendUnsafe')}</span>
            </span>
          </div>
        </div>

        {/* FLOATING ZOOM CONTROLS (Right) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-1 sm:p-1.5 shadow-xl z-20">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <div className="px-1.5 sm:px-2 border-l border-slate-800 text-[9px] sm:text-[10px] font-bold text-slate-400 font-mono select-none">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* SELECTED CITY BOTTOM DETAIL CARD SLIDE-UP */}
      {selectedCity && (
        <div
          id="map-detail-panel"
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-5 pt-7 sm:pt-5 rounded-t-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in z-30"
        >
          {/* Panel Close Button */}
          <button
            onClick={closePanel}
            id="close-panel-btn"
            className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Quick city safety details */}
          <div className="flex items-center gap-3.5" id="panel-city-info">
            <div
              className="h-12 w-12 rounded-2xl flex flex-col items-center justify-center border text-white font-black font-title shadow-sm shrink-0"
              style={{ backgroundColor: getScoreColors(selectedCity.safety_score).hex, borderColor: getScoreColors(selectedCity.safety_score).hex }}
            >
              <span className="text-base">{selectedCity.safety_score}</span>
              <span className="text-[8px] opacity-75 font-mono">/10</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{selectedCity.city}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black text-white shrink-0" style={{ backgroundColor: getScoreColors(selectedCity.safety_score).hex }}>
                  {getScoreLabel(selectedCity.safety_score)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide font-mono mt-0.5">{selectedCity.country} • Sourced from {selectedCity.primary_source_type}</p>
            </div>
          </div>

          <button
            id="panel-view-report"
            onClick={() => onCitySelected(selectedCity.country, selectedCity.city)}
            className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl text-xs transition-all duration-300 hover:scale-[1.02] shadow-md shadow-blue-100 shrink-0 cursor-pointer text-center"
          >
            {t('map.viewReport')}
          </button>
        </div>
      )}

    </div>
  );
};
