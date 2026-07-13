# Phase 2 — City Water Database
## Complete Build Plan

**Goal**: User enters country + city → sees water safety score, typical water color, contaminants, % population affected, and AI-generated plain-English summary
**AI**: Google Gemini 1.5 Flash (free, text-only this time — no image)
**Data**: Static JSON dataset (no database needed)
**Estimated time**: 3–4 hours
**End result**: New "Check a City" tab live alongside Phase 1's photo checker

---

---

## STEP 1 — Types + Dataset File
**Goal**: Define city data shape and add the dataset

**Prompt**:
```
In the aquacheck project, do two things:

1. Create src/types/city.ts with this exact TypeScript interface (export it):

interface CityWaterData {
  country: string
  city: string
  safety_score: number
  safety_label: 'SAFE' | 'CAUTION' | 'UNSAFE'
  typical_color: string
  typical_color_hex: string
  population_percent_unsafe: number
  estimated_yearly_deaths: number | null
  common_contaminants: string[]
  primary_source_type: string
  data_source: string
  last_updated: string
  notes: string | null
}

Also export a CityLookupResult discriminated union:
- { found: true; data: CityWaterData }
- { found: false; suggestions: { country: string; city: string }[] }

2. Create data/water-by-city.json at the project root (NOT inside src/) with this exact array of 15 cities:

[paste the full 15-city JSON array from city data source here exactly as written]

Confirm the JSON is valid (no trailing commas, proper structure) and the TypeScript file has no errors.
```

**You know it worked when**: Both files exist, JSON validates, no TypeScript errors

---

## STEP 2 — Data Layer (cityData.ts)
**Goal**: Functions to search and retrieve city data

**Prompt**:
```
In the aquacheck project, create src/lib/cityData.ts

This file loads data/water-by-city.json and provides query functions. Import the JSON directly (Next.js supports JSON imports).

Import CityWaterData and CityLookupResult from '../types/city'

Implement these exported functions:

1. function normalize(text: string): string
   - lowercase, trim, collapse multiple spaces to single space

2. export function getCityData(country: string, city: string): CityLookupResult
   - Normalize both inputs
   - Find exact match in dataset (normalized country AND normalized city both match)
   - If found: return { found: true, data: matchedCity }
   - If not found: find up to 3 cities where normalized city name is a partial match (includes) regardless of country, OR same country with different city
   - Return { found: false, suggestions: [...] } with those close matches (just country+city pairs)
   - If truly nothing close: return { found: false, suggestions: [] }

3. export function listAvailableCities(): { country: string; city: string }[]
   - Return all country+city pairs from the dataset, sorted alphabetically by country then city

4. export function listCountries(): string[]
   - Return unique sorted list of all countries in the dataset

5. export function getCitiesInCountry(country: string): string[]
   - Return all city names for a given country (normalized match), sorted alphabetically

No any types. Pure functions, no side effects, no external calls.
```

**You know it worked when**: Functions exist and TypeScript compiles with no errors

---

## STEP 3 — Gemini City Summary Function
**Goal**: AI generates a plain-English summary FROM the real data (not inventing numbers)

**Prompt**:
```
In the aquacheck project, add a new function to src/lib/gemini.ts (the file already has analyzeWaterImage — add to it, don't replace it).

Import CityWaterData from '../types/city'

Add this new exported function:

export async function getCitySummary(data: CityWaterData): Promise<string>

Inside the function:
1. Check GEMINI_API_KEY exists (reuse same check pattern as analyzeWaterImage)
2. Build a text prompt (NOT an image this time) using this exact template, filling in the real data values:

"You are a water quality expert writing a short, clear summary for ordinary readers (not scientists). Use ONLY the facts given below — do not add any numbers, statistics, or facts that are not provided here.

City: {city}, {country}
Safety score: {safety_score}/10 ({safety_label})
Typical water appearance: {typical_color}
Percentage of population without safe water access: {population_percent_unsafe}%
Common contaminants: {common_contaminants joined by comma}
Primary water source: {primary_source_type}
Data source: {data_source}

Write a 2-3 sentence plain-English summary explaining what this means for someone living in or visiting this city. Be honest and direct but not alarmist. End with one practical sentence of advice. Do not invent any statistics not listed above. Respond with plain text only, no JSON, no markdown formatting."

3. Call model.generateContent([prompt]) — text only, no image part this time
4. Return result.response.text().trim()
5. Catch errors the same way as analyzeWaterImage (NO_API_KEY, RATE_LIMIT, generic fallback) — but instead of throwing, return a safe fallback string: "Summary unavailable right now. The data above is still accurate."

This function must NEVER throw — always return a string, even on error, so the city report can still show the structured data even if the AI summary fails.
```

**You know it worked when**: Function compiles, returns a string type always

---

## STEP 4 — City API Route
**Goal**: Endpoint that combines dataset lookup + AI summary

**Prompt**:
```
In the aquacheck project, create src/app/api/city/route.ts

export const runtime = 'nodejs'

Import NextResponse from 'next/server'
Import getCityData from '../../../lib/cityData'
Import getCitySummary from '../../../lib/gemini'

Export async function GET(request: Request):

1. Parse query params from request.url using URL/searchParams: country, city
   Both required. If either missing: return 400, { success: false, error: "Please provide both country and city" }

2. Call getCityData(country, city)

3. If result.found is false:
   Return 404 with: { success: false, error: "No data available for this city yet", suggestions: result.suggestions }

4. If result.found is true:
   a. Call await getCitySummary(result.data) — wrap in try/catch, if it throws use fallback string "Summary unavailable right now."
   b. Return 200 with: { success: true, data: result.data, summary: summaryText }

Always return JSON. Never let an unhandled error crash the route — wrap the whole handler body in try/catch with a final fallback 500 response: { success: false, error: "Something went wrong. Please try again." }
```

**You know it worked when**: `curl "localhost:3000/api/city?country=Pakistan&city=Karachi"` returns real data + summary

---

## STEP 5 — CitySearch Component
**Goal**: Country + city input UI

**Prompt**:
```
In the aquacheck project, create src/components/CitySearch.tsx

'use client' component.

Props interface CitySearchProps:
- onSearch: (country: string, city: string) => void
- isLoading: boolean

Import listCountries and getCitiesInCountry from '../lib/cityData'

Build:
1. Two dropdowns side by side on desktop, stacked on mobile (flex flex-col md:flex-row gap-3):
   
   a. Country select:
      - label "Country" (text-xs text-slate-400 mb-1 block)
      - <select> populated from listCountries(), styled: border border-slate-200 rounded-xl px-4 py-3 w-full text-slate-700
      - Default empty option: "Select country"
   
   b. City select:
      - label "City" (same style)
      - <select> populated from getCitiesInCountry(selectedCountry) — disabled and shows "Select country first" placeholder until a country is chosen
      - Same styling as country select

2. Search button below (or beside on desktop):
   - "Check Water Quality" text
   - bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-6 font-semibold w-full md:w-auto
   - Disabled (opacity-50, cursor-not-allowed) until both country and city are selected, or while isLoading
   - When isLoading: show small spinner + "Checking..." text instead

3. On submit: call onSearch(selectedCountry, selectedCity)

4. State: selectedCountry (string), selectedCity (string) — reset selectedCity to empty whenever country changes

Full TypeScript, Tailwind only, no external dependencies.
```

**You know it worked when**: Selecting country populates city dropdown, button enables only when both chosen

---

## STEP 6 — WaterColorSwatch + CityReport Components
**Goal**: Visual display of city water results

**Prompt**:
```
In the aquacheck project, create two components.

--- src/components/WaterColorSwatch.tsx ---
Props: { hex: string; label: string }
Simple component: a rounded square (w-16 h-16 rounded-xl, flex-shrink-0) with backgroundColor set inline to the hex prop (this is the ONE acceptable use of inline style — for dynamic colors not in Tailwind's palette), plus a border (border border-slate-200). Below or beside it, show the label text (text-xs text-slate-500 mt-1, max-w-[100px]).
Layout: flex flex-col items-center text-center, gap-1.

--- src/components/CityReport.tsx ---
Props: { data: CityWaterData; summary: string } — import CityWaterData from '../types/city'
Import WaterColorSwatch from './WaterColorSwatch'
Import getScoreColors, getScoreLabel from '../lib/scoring' (reuse Phase 1 helpers — safety_score uses same 1-10 scale)

Sections, in order:

1. HEADER: City + Country name (text-2xl font-bold text-slate-800), e.g. "Karachi, Pakistan"

2. SCORE + SWATCH ROW (flex gap-4 items-center, mb-4):
   - Score circle (reuse same SVG arc pattern as Phase 1 ScoreCard, but smaller: 80x80) showing safety_score/10
   - <WaterColorSwatch hex={data.typical_color_hex} label={data.typical_color} />
   - safety_label badge (SAFE=emerald, CAUTION=amber, UNSAFE=red) — pill shape

3. AI SUMMARY box (bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-4):
   - Small label "Summary" (text-xs font-semibold text-blue-600 uppercase mb-1)
   - The summary text (text-sm text-slate-700 leading-relaxed)

4. STATS GRID (grid grid-cols-2 gap-3 mb-4):
   - Population without safe water: {population_percent_unsafe}% (large number style like Phase 1 details grid)
   - Estimated yearly deaths: show number if not null, otherwise "Data not available" in slate-400
   - Primary water source: {primary_source_type}
   - Last updated: {last_updated}

5. CONTAMINANTS section (mb-4):
   Same pill style as Phase 1 ScoreCard contaminants section
   If empty array: "No major contaminants reported"

6. NOTES (if data.notes is not null):
   Small italic text box (bg-slate-50 rounded-lg p-3 text-sm text-slate-600 italic)

7. SOURCE CITATION (bottom):
   text-xs text-slate-300, "Source: {data_source} ({last_updated})"

Full TypeScript, no any, Tailwind only (except the one inline color in WaterColorSwatch).
```

**You know it worked when**: Component renders with mock data showing all sections

---

## STEP 7 — NavTabs + City Page + Wire It Together
**Goal**: Connect everything into a working second feature

**Prompt**:
```
In the aquacheck project, create the navigation and city page.

--- src/components/NavTabs.tsx ---
'use client' component. Uses Next.js navigation.
Import { usePathname, useRouter } from 'next/navigation'

Two tabs, equal width, segmented control style:
- "Check a Photo" → links to '/'
- "Check a City" → links to '/city'

Container: flex bg-slate-100 rounded-xl p-1 max-w-md mx-auto mb-6
Each tab button: flex-1 py-2 rounded-lg text-sm font-medium text-center transition-colors
- Active tab (matches current pathname): bg-white text-blue-600 shadow-sm
- Inactive tab: text-slate-500 hover:text-slate-700

Use router.push() on click, and usePathname() to determine active state.

--- src/app/city/page.tsx ---
Server component page (no 'use client' at top level).

Same header structure as src/app/page.tsx (logo + tagline), then:
- <NavTabs /> 
- A new 'use client' component <CityChecker /> (create this as src/components/CityChecker.tsx)
Same footer as home page.

--- src/components/CityChecker.tsx ---
'use client' component — the state machine for the city feature, mirrors WaterChecker.tsx pattern from Phase 1.

Import CitySearch, CityReport from their files. Import CityWaterData from types/city.

State:
- phase: 'search' | 'loading' | 'result' | 'notfound' | 'error'
- result: { data: CityWaterData; summary: string } | null
- suggestions: { country: string; city: string }[]
- errorMessage: string

Render:
- phase 'search': <CitySearch onSearch={handleSearch} isLoading={false} />
- phase 'loading': <CitySearch onSearch={handleSearch} isLoading={true} /> + centered spinner below with "Looking up water data..." text
- phase 'result': <CityReport data={result.data} summary={result.summary} /> + "Search another city" button (resets to search phase)
- phase 'notfound': message box "We don't have data for this city yet" + if suggestions.length > 0, show them as clickable chips that re-trigger search with that country/city + "Search another city" button
- phase 'error': red error box with errorMessage + retry button

handleSearch(country, city):
- Set phase 'loading'
- fetch(`/api/city?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`)
- On success (status 200): set result, phase 'result'
- On 404: set suggestions from response, phase 'notfound'
- On other error: set errorMessage, phase 'error'
- Catch network errors: errorMessage "Network error. Check your connection.", phase 'error'

--- Update src/app/page.tsx ---
Add <NavTabs /> right after the header, before <WaterChecker />, so users can navigate between both features from the home page too.
```

**You know it worked when**: Full flow works — select country/city → loading → see report with AI summary, and tab navigation switches between Photo Check and City Check

---

## STEP 8 — Polish & Edge Cases
**Goal**: Handle the rough edges

**Prompt**:
```
In the aquacheck project, add these polish items:

1. In CityChecker.tsx, when phase is 'notfound' and suggestions exist, clicking a suggestion chip should auto-fill and re-trigger handleSearch with that country/city immediately (no extra click needed).

2. Add a small "Don't see your city?" note at the bottom of the search phase in CitySearch.tsx: text-xs text-slate-400 text-center mt-3, text: "Don't see your city? We're adding more locations soon."

3. In CityReport.tsx, add a fade-in animation on mount (reuse the animate-fade-in class from Phase 1's globals.css if it exists, otherwise add it).

4. Make sure the score circle in CityReport correctly reuses getScoreColors — UNSAFE should always show red regardless of exact score number edge cases, SAFE should always show emerald, CAUTION amber. Double check the safety_label field drives the color, not just the raw score number, in case they ever mismatch.

5. Run npm run build and fix any TypeScript or build errors. Show me the full output.
```

**You know it worked when**: `npm run build` succeeds with 0 errors

---

## STEP 9 — Test Phase 2
**Goal**: Verify everything works

**Prompt**:
```
Create scripts/test-city-api.ts for the aquacheck project.

Test these cases against http://localhost:3000/api/city, print PASS/FAIL:
1. Missing both params → expect 400
2. Valid city (Pakistan, Karachi) → expect 200 with data.safety_score present
3. Country exists but city doesn't (Pakistan, FakeCityXYZ) → expect 404 with suggestions array
4. Completely invalid country → expect 404

Run with: npx tsx scripts/test-city-api.ts

Then give me a manual browser test checklist covering:
- Selecting country populates city dropdown correctly
- Search button disabled until both fields chosen
- Successful search shows full report with AI summary
- Not-found city shows suggestions and they're clickable
- Tab navigation between Photo Check and City Check preserves correctly
- Mobile layout at 375px — dropdowns and report are readable
```

---

## STEP 10 — Redeploy
**Goal**: Push Phase 2 live

**Prompt**:
```
Help me redeploy the aquacheck project to Vercel with Phase 2 changes:

1. Confirm data/water-by-city.json is NOT in .gitignore (it should be committed — it's part of the app, not a secret)
2. Give me git commands: add, commit with message "Add Phase 2: city water database", push
3. Confirm Vercel auto-redeploys on push (if connected to GitHub) — if not, give me the npx vercel command to redeploy manually
4. No new environment variables needed — confirm GEMINI_API_KEY is still set in Vercel dashboard from Phase 1
```

---

## Files created/changed in Phase 2
```
data/
└── water-by-city.json          NEW

src/
├── app/
│   ├── page.tsx                 UPDATED (added NavTabs)
│   ├── city/
│   │   └── page.tsx             NEW
│   └── api/
│       └── city/
│           └── route.ts         NEW
├── components/
│   ├── NavTabs.tsx               NEW
│   ├── CitySearch.tsx            NEW
│   ├── CityReport.tsx            NEW
│   ├── WaterColorSwatch.tsx      NEW
│   └── CityChecker.tsx           NEW
├── lib/
│   ├── gemini.ts                 UPDATED (added getCitySummary)
│   └── cityData.ts               NEW
└── types/
    └── city.ts                   NEW

scripts/
└── test-city-api.ts              NEW
```

## After Phase 2 is done, show to sir
- Live URL with both tabs working
- Screenshot of a city search result (e.g. Karachi)
- Point out: AI only writes the summary sentence, all numbers come from real cited sources — this shows responsible AI use
