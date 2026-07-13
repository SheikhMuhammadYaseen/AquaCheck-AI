# Phase 3 — Health Impact Reports + Charts + World Map
## Complete Build Plan

**Goal**: Turn the city water data into powerful visual health impact reports — bar charts, disease breakdowns, 10-year projections, and an interactive world map where users can click any marked city to see its report.
**New packages**: recharts + react-simple-maps (both free, open source)
**Estimated time**: 4–5 hours
**End result**: City reports now have rich charts, a 3rd "World Map" tab is live

---

## Before you start
- [ ] Phase 1 and Phase 2 working and deployed
- [ ] Run: `npm install recharts react-simple-maps`
- [ ] Run: `npm install --save-dev @types/react-simple-maps` (if TypeScript errors on import)
- [ ] Update data/water-by-city.json with new Phase 3 fields (from city data schema)
- [ ] Replace src/types/city.ts with the updated schema (from city data schema)

---

## STEP 1 — Update Types + Dataset
**Goal**: Add new health fields to TypeScript types and JSON dataset

**Prompt**:
```
In the aquacheck project, update two files for Phase 3:

1. Replace src/types/city.ts entirely with this updated version:

Add two new interfaces before CityWaterData:

interface DiseaseBreakdownItem {
  disease: string
  estimated_percent: number
  description: string
}

interface HistoricalDataPoint {
  year: number
  population_percent_unsafe: number
}

Add these fields to CityWaterData (keep all Phase 2 fields, add these at the end):
  disease_breakdown: DiseaseBreakdownItem[]
  historical_trend: HistoricalDataPoint[]
  economic_loss_usd_millions: number | null
  children_under5_deaths: number | null
  future_risk_level: 'IMPROVING' | 'STABLE' | 'WORSENING'
  future_risk_reason: string

Also export DiseaseBreakdownItem and HistoricalDataPoint interfaces.

2. Create src/types/health.ts with:

export interface RiskProjection {
  city: string
  country: string
  current_year: number
  projected_data: {
    year: number
    projected_percent_unsafe: number
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  narrative: string
  assumptions: string
}

3. Update data/water-by-city.json — add the Phase 3 fields (disease_breakdown, historical_trend, economic_loss_usd_millions, children_under5_deaths, future_risk_level, future_risk_reason) to every city entry using the city data schema.

For cities with a safety_score of 8-10 (New York, London), disease_breakdown should be an empty array [].

Confirm TypeScript compiles with no errors after these changes.
```

**You know it worked when**: TypeScript happy, JSON valid, no errors on `npm run build`

---

## STEP 2 — 10-Year Projection Logic + API Route
**Goal**: Calculate a simple linear projection and generate AI narrative

**Prompt**:
```
In the aquacheck project, do two things:

1. Add a helper function to src/lib/cityData.ts:

export function calculateProjection(data: CityWaterData): RiskProjection

Import RiskProjection from '../types/health'

Logic:
- current_year = new Date().getFullYear()
- Use historical_trend to calculate average annual change (slope) in population_percent_unsafe
  - If trend has >= 2 points: slope = (last value - first value) / (last year - first year)
  - If trend has < 2 points: slope = 0
- Project for years: current_year, current_year+2, current_year+5, current_year+10
- projected_percent_unsafe = last known value + (slope * years_from_last_known)
- Clamp values between 0 and 100
- confidence: 'HIGH' if historical_trend has 4+ points, 'MEDIUM' if 2-3, 'LOW' if 0-1
- assumptions: "Based on historical trend from {first year} to {last year}. Projection assumes current conditions continue unchanged."
- narrative: "" (empty string — will be filled by Gemini)

Return the RiskProjection object (narrative will be filled by the API route).

2. Create src/app/api/projection/route.ts

export const runtime = 'nodejs'

GET handler:
- Parse query params: country, city
- If either missing: 400 error
- Call getCityData(country, city) — if not found: 404
- Call calculateProjection(result.data)
- Call getCityProjectionNarrative(result.data, projection) from lib/gemini (you will add this in Step 3)
- Set projection.narrative = the returned text
- Return 200: { success: true, data: projection }
```

**You know it worked when**: `curl "localhost:3000/api/projection?country=Pakistan&city=Karachi"` returns projection data

---

## STEP 3 — Gemini Projection Narrative
**Goal**: AI writes the 10-year outlook in plain English (using ONLY the real data)

**Prompt**:
```
In the aquacheck project, add a new function to src/lib/gemini.ts

Import RiskProjection from '../types/health'
Import CityWaterData from '../types/city'

Add:
export async function getCityProjectionNarrative(
  cityData: CityWaterData,
  projection: RiskProjection
): Promise<string>

Use this exact prompt, filling in the real values:

"You are a public health analyst writing for a general audience. Use ONLY the data provided below. Do not add any statistics or facts not listed here.

City: {city}, {country}
Current population without safe water access: {population_percent_unsafe}%
Future risk assessment: {future_risk_level}
Reason for trend: {future_risk_reason}
Projected % without safe water in 10 years: {projection.projected_data.last item's projected_percent_unsafe}%
Main contaminants: {common_contaminants joined by comma}

Write 2-3 sentences explaining what the next 10 years looks like for water safety in this city if nothing changes. Be honest about uncertainty. Use plain language — no jargon. Do not use the word 'projection' — say 'if current trends continue'. End with one sentence on what would need to change to improve the outcome. Plain text only, no markdown, no bullet points."

Same error handling as getCitySummary: never throw, return a fallback string on any error:
"Future projection data is unavailable right now."
```

**You know it worked when**: Function returns a plain-text paragraph, TypeScript compiles

---

## STEP 4 — DiseaseBreakdown Chart Component
**Goal**: Pie chart + bar chart of disease breakdown

**Prompt**:
```
In the aquacheck project, create src/components/DiseaseBreakdown.tsx

'use client' — recharts requires client component.

Import from recharts: PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
Import DiseaseBreakdownItem from '../types/city'

Props: { breakdown: DiseaseBreakdownItem[]; cityName: string }

If breakdown is empty or length === 0:
  Return a box saying: "No significant disease burden from water contamination reported for this city." in text-slate-400 text-sm text-center py-6

Otherwise render:

1. Section heading: "Disease Burden from Unsafe Water" (text-base font-semibold text-slate-700 mb-3)

2. A horizontal BarChart (ResponsiveContainer width="100%" height={breakdown.length * 52 + 40}):
   - layout="vertical"
   - data = breakdown (each item: { disease, estimated_percent, description })
   - YAxis: dataKey="disease", type="category", width=130, tick fontSize=11, text color slate-600
   - XAxis: type="number", domain=[0,100], tick fontSize=11, unit="%"
   - Bar: dataKey="estimated_percent", radius=[0,4,4,0]
     Each bar colored by disease index cycling through: ['#EF4444','#F59E0B','#8B5CF6','#3B82F6','#10B981']
   - Tooltip: shows disease name + percent + description (custom tooltip component)
   - CartesianGrid: strokeDasharray="3 3", vertical only, stroke="#f1f5f9"

3. Custom Tooltip for the bar chart:
   When hovering, show a small white card (bg-white border border-slate-200 rounded-lg p-3 shadow-sm):
   - Disease name bold
   - "~X% of water-related deaths"
   - description text in slate-500

4. Below the chart, a small disclaimer:
   text-xs text-slate-300 italic text-center mt-2
   "Percentages are estimated from WHO Global Burden of Disease data for this region"

Full TypeScript. No any types.
```

**You know it worked when**: Chart renders with bars for each disease, tooltip shows on hover

---

## STEP 5 — Historical Trend + Projection Chart
**Goal**: Line chart showing past trend + projected future

**Prompt**:
```
In the aquacheck project, create src/components/RiskProjection.tsx

'use client' component.

Import from recharts: LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
Import RiskProjection from '../types/health'
Import CityWaterData from '../types/city'

Props: {
  cityData: CityWaterData
  projection: RiskProjection | null
  isLoading: boolean
}

Render:

1. Section heading: "10-Year Water Safety Outlook" (text-base font-semibold text-slate-700 mb-3)

2. If isLoading: show animate-pulse gray bar placeholder (h-48 bg-slate-100 rounded-xl)

3. If projection is null and not loading: show "Projection unavailable" in slate-400

4. If projection data available:

   Build combined chart data array merging historical + projected:
   - Historical points from cityData.historical_trend: { year, value: population_percent_unsafe, type: 'historical' }
   - Projected points from projection.projected_data: { year, value: projected_percent_unsafe, type: 'projected' }
   - Sort all by year
   - The current year is the junction point between historical and projected

   ResponsiveContainer width="100%" height={220}:
   LineChart with this data:
   - XAxis: dataKey="year", tick fontSize=11
   - YAxis: domain=[0,100], tick fontSize=11, unit="%", label={{ value: '% unsafe', angle: -90, position: 'insideLeft', fontSize: 11 }}
   - Two Line components:
     a. Historical data only (filter where type=historical): stroke="#EF4444", strokeWidth=2, dot={radius:4}, name="Historical"
     b. Projected data only (filter where type=projected): stroke="#94A3B8", strokeWidth=2, strokeDasharray="5 5", dot={radius:3}, name="Projected"
   - ReferenceLine x={current_year} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Today', fontSize: 10, fill: '#3B82F6' }}
   - CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"
   - Tooltip showing year + percentage
   - Legend: fontSize=11

5. Future risk badge below chart:
   future_risk_level pill: IMPROVING=emerald, STABLE=amber, WORSENING=red
   Arrow icon before text: ↑ IMPROVING, → STABLE, ↓ WORSENING

6. AI Narrative box (bg-slate-50 rounded-xl p-4 mt-3):
   projection.narrative text in text-sm text-slate-600 leading-relaxed

7. Small disclaimer: "Projection based on historical trends. Assumes current conditions continue."
   text-xs text-slate-300 italic mt-2

Full TypeScript, no any.
```

**You know it worked when**: Chart shows historical line + dashed projected line with "Today" reference line

---

## STEP 6 — HealthCharts Wrapper + Update CityReport
**Goal**: Combine disease + projection charts and plug into existing CityReport

**Prompt**:
```
In the aquacheck project, create src/components/HealthCharts.tsx and update CityReport.tsx

--- HealthCharts.tsx ---
'use client' component.

Props: {
  cityData: CityWaterData
}

Import DiseaseBreakdown, RiskProjection component
Import RiskProjection type from '../types/health'
Import { useState, useEffect } from 'react'

State:
- projection: RiskProjection | null = null
- isLoadingProjection: boolean = true
- projectionError: boolean = false

On mount (useEffect with [cityData.city, cityData.country]):
  fetch(`/api/projection?country=${encodeURIComponent(cityData.country)}&city=${encodeURIComponent(cityData.city)}`)
  On success: setProjection(data.data), setIsLoadingProjection(false)
  On error: setProjectionError(true), setIsLoadingProjection(false)

Render (both sections stacked, gap-6):
1. <DiseaseBreakdown breakdown={cityData.disease_breakdown} cityName={cityData.city} />
2. Divider line (border-t border-slate-100)
3. <RiskProjection cityData={cityData} projection={projection} isLoading={isLoadingProjection} />
   If projectionError: show "Could not load projection" in slate-400 small text

--- Update CityReport.tsx ---
Import HealthCharts from './HealthCharts'

After the STATS GRID section (section 4) and before CONTAMINANTS, insert:
- A divider (border-t border-slate-100 my-4)
- <HealthCharts cityData={data} />

Also update the STATS GRID to add two new stat cards (making it a 2-column grid with wrapping):
- Children under 5 deaths: {children_under5_deaths?.toLocaleString() ?? 'Data not available'} per year
- Economic loss: {economic_loss_usd_millions ? `$${economic_loss_usd_millions}M/year` : 'Data not available'}

These join the existing 4 stat cards. All 6 in a grid-cols-2 gap-3 layout.
```

**You know it worked when**: CityReport now shows charts below the stats, charts load asynchronously

---

## STEP 7 — World Map Component
**Goal**: Interactive map with city markers — click to see the city report

**Prompt**:
```
In the aquacheck project, create src/components/WorldMap.tsx

'use client' component.

Import from 'react-simple-maps': ComposableMap, Geographies, Geography, Marker, ZoomableGroup
Import listAvailableCities and getCityData from '../lib/cityData'
Import getScoreColors from '../lib/scoring'
Import { useState } from 'react'
Import CityWaterData from '../types/city'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

City coordinates map (hardcode these since our dataset is fixed 15 cities):
```typescript
const CITY_COORDS: Record<string, [number, number]> = {
  'Karachi': [67.01, 24.86],
  'Lahore': [74.34, 31.55],
  'Islamabad': [73.04, 33.72],
  'Peshawar': [71.56, 34.01],
  'Delhi': [77.10, 28.70],
  'Mumbai': [72.87, 19.07],
  'Dhaka': [90.40, 23.72],
  'Nairobi': [36.82, -1.29],
  'Lagos': [3.38, 6.45],
  'Cairo': [31.23, 30.04],
  'Jakarta': [106.84, -6.21],
  'Manila': [120.98, 14.60],
  'Flint': [-83.69, 43.01],
  'New York': [-74.00, 40.71],
  'London': [-0.12, 51.51],
}
```

State:
- selectedCity: CityWaterData | null = null
- hoveredCity: string | null = null

Get all cities from listAvailableCities()

Render:

1. Map container: w-full, aspect-ratio or fixed height h-72 md:h-[420px], bg-slate-100 rounded-2xl overflow-hidden relative

2. ComposableMap (projection="geoMercator", projectionConfig={{ scale: 120, center: [20, 10] }}, width=800, height=400):
   
   Geographies from GEO_URL:
   Each Geography:
   - fill: "#e2e8f0" (slate-200)
   - stroke: "#cbd5e1" (slate-300)
   - strokeWidth: 0.5
   - outline: none
   - hover fill: "#dde6f0"
   
   Markers for each city in CITY_COORDS:
   - Find city data with getCityData(country, city) — skip if null
   - Circle: r=6, fill=getScoreColors(city.safety_score).hex, stroke="white", strokeWidth=1.5
   - On hover: r=8, add drop shadow
   - On click: setSelectedCity(cityData)
   - Tooltip on hover: show city name + score (absolute positioned div, styled card)

3. If selectedCity is not null:
   Show a slide-up panel at the bottom of the map container (absolute bottom-0 left-0 right-0, bg-white, rounded-t-2xl, p-4, max-h-48, overflow-y-auto, shadow-lg):
   - City name + country (font-semibold)
   - Score circle (small, 48px, reuse same colors)
   - Safety label badge
   - "View Full Report →" button → href={`/city?country=${country}&city=${city}`} (navigate to city page with pre-filled search)
   - X close button top-right (onClick: setSelectedCity(null))

4. Map legend bottom-left corner (absolute, bg-white/80 backdrop-blur rounded-lg p-2):
   Three colored dots with labels: ● Safe (emerald) ● Caution (amber) ● Unsafe (red)
   text-xs text-slate-600

Props: none — self-contained component
```

**You know it worked when**: World map renders with colored city markers, clicking shows mini-panel

---

## STEP 8 — Map Page + Update NavTabs
**Goal**: New "World Map" tab with full map page

**Prompt**:
```
In the aquacheck project, create the map page and update navigation.

--- Update src/components/NavTabs.tsx ---
Change from 2 tabs to 3 tabs:
- "📷 Photo Check" → href='/'
- "🌍 City Check" → href='/city'
- "🗺 World Map" → href='/map'

Keep the same segmented control styling. On mobile, make the 3 tabs fit: smaller text (text-xs on mobile, text-sm on md+), use shorter labels on mobile: "Photo" | "City" | "Map" and longer on md+: "Photo Check" | "City Check" | "World Map".

Active state: still matches usePathname().

--- Create src/app/map/page.tsx ---
Server component.

Same header as other pages (AquaCheck logo + tagline).
<NavTabs />

Below: a 'use client' wrapper component <MapExplorer> (create in src/components/MapExplorer.tsx)

--- Create src/components/MapExplorer.tsx ---
'use client' component.

Render:
1. Heading: "Explore Water Quality Worldwide" (text-xl font-semibold text-slate-700 mb-2)
2. Subtext: "Click any city marker to see its water safety data. {n} cities tracked." text-sm text-slate-400 mb-4
3. <WorldMap /> (full width)
4. Below map: "Cities in our database" section
   A flex-wrap list of all cities from listAvailableCities() as clickable pills
   Each pill: country flag emoji (derive from country name — use a small helper) + "City, Country"
   Clicking navigates to /city?country=X&city=Y using router.push

Country flag emojis helper (hardcode for the countries we have):
Pakistan=🇵🇰, India=🇮🇳, Bangladesh=🇧🇩, Kenya=🇰🇪, Nigeria=🇳🇬, Egypt=🇪🇬, Indonesia=🇮🇩, Philippines=🇵🇭, "United States"=🇺🇸, "United Kingdom"=🇬🇧

Also update city/page.tsx to accept URL search params so it can pre-fill the city search when navigated from the map:
- In CityChecker.tsx, check for URL searchParams ?country=X&city=Y on mount
- If both present, auto-trigger handleSearch(country, city) immediately
```

**You know it worked when**: Map tab shows world map with markers, clicking a city shows mini-panel, "View Full Report" navigates correctly

---

## STEP 9 — Polish
**Goal**: Smooth everything out

**Prompt**:
```
In the aquacheck project, add these final Phase 3 polish items:

1. Loading state for WorldMap while the GeoJSON loads from CDN:
   Show animate-pulse gray rectangle placeholder (same height as map) while Geographies loads.
   Add a try/catch around the geography fetch — if it fails, show "Map unavailable. Browse cities below." and just show the city pill list.

2. In RiskProjection component, format numbers nicely:
   Instead of "63.2%" show "63%" — round to nearest integer for the projection chart Y axis and tooltip.

3. In CityReport stats grid, format numbers with .toLocaleString() for thousands separators:
   "8,400 deaths/year" not "8400 deaths/year"

4. In HealthCharts, add a subtle section divider with label:
   Between DiseaseBreakdown and RiskProjection, add:
   <div className="flex items-center gap-3 my-4">
     <div className="flex-1 border-t border-slate-100" />
     <span className="text-xs text-slate-300 uppercase tracking-wider">10-Year Outlook</span>
     <div className="flex-1 border-t border-slate-100" />
   </div>

5. Run npm run build — fix ALL TypeScript errors and build warnings.
   Show full output.
```

**You know it worked when**: `npm run build` passes with 0 errors

---

## STEP 10 — Test + Deploy
**Goal**: Verify Phase 3 and push live

**Prompt**:
```
In the aquacheck project, help me test and deploy Phase 3.

1. Create scripts/test-phase3.ts:
   Test these API endpoints (localhost:3000), print PASS/FAIL:
   - GET /api/projection?country=Pakistan&city=Karachi → expect 200 + projected_data array
   - GET /api/projection?country=Pakistan&city=Karachi → projected_data should have 4 entries (current, +2, +5, +10 years)
   - GET /api/projection → expect 400 (missing params)
   - GET /api/projection?country=Fake&city=Fake → expect 404
   Run with: npx tsx scripts/test-phase3.ts

2. Manual test checklist for browser:
   List every scenario to test across all 3 tabs and new charts:
   - Disease breakdown chart renders for Karachi (unsafe city)
   - Disease breakdown shows "No data" message for London (safe city)
   - 10-year projection chart shows dashed line for future years
   - Future risk badge colors match (WORSENING=red, IMPROVING=emerald, STABLE=amber)
   - World map loads with 15 city markers
   - Each marker color matches its safety score
   - Clicking a marker shows the mini-panel
   - "View Full Report" navigates to correct city
   - NavTabs shows 3 tabs, active tab highlighted
   - Map tab shows city pill list
   - Clicking a city pill navigates and auto-loads report

3. Deploy commands:
   git add, commit "Add Phase 3: health charts, disease breakdown, world map", push
   Confirm Vercel auto-redeploys.
   No new environment variables needed.
```

---

## Files created/changed in Phase 3
```
src/
├── app/
│   ├── map/page.tsx               NEW
│   └── api/
│       └── projection/route.ts    NEW
├── components/
│   ├── NavTabs.tsx                UPDATED (3 tabs)
│   ├── CityReport.tsx             UPDATED (6 stats + HealthCharts)
│   ├── HealthCharts.tsx           NEW
│   ├── DiseaseBreakdown.tsx       NEW
│   ├── RiskProjection.tsx         NEW  ← (component, same name as type)
│   ├── WorldMap.tsx               NEW
│   └── MapExplorer.tsx            NEW
├── lib/
│   ├── gemini.ts                  UPDATED (getCityProjectionNarrative)
│   └── cityData.ts                UPDATED (calculateProjection)
└── types/
    ├── city.ts                    UPDATED (richer schema)
    └── health.ts                  NEW

data/
└── water-by-city.json             UPDATED (Phase 3 fields added)

scripts/
└── test-phase3.ts                 NEW
```

## After Phase 3, AquaCheck has 3 fully working tabs
1. **Photo Check** — upload water image → AI score + risks
2. **City Check** — search city → data + AI summary + disease chart + 10yr projection
3. **World Map** — visual explorer with clickable city markers
```
