# Phase 4 — Community Reports + PWA + Urdu/Hindi
## Complete Build Plan

**Goal**: Users can submit water reports, see live community reports from their city, install AquaCheck like a native app, and use it in Urdu or Hindi.
**New tools**: Supabase (free DB), next-pwa (installable app), custom i18n (3 languages)
**Estimated time**: 6–8 hours
**End result**: 4-tab app, installable on any phone, works in 3 languages

---

## Before you start
- [ ] Phase 1, 2, 3 working and deployed
- [ ] Create free Supabase project at supabase.com (takes 2 minutes)
- [ ] Run the Supabase SQL schema in Supabase SQL Editor
- [ ] Copy Supabase URL + anon key to .env.local
- [ ] Run: `npm install @supabase/supabase-js next-pwa`
- [ ] Create PWA icons for the app

---

## STEP 1 — Supabase Setup + Types
**Goal**: Database ready, TypeScript types defined, Supabase client working

**Prompt**:
```
In the aquacheck project, set up Supabase integration for Phase 4.

1. Create src/types/report.ts with these exported types:

interface CommunityReport {
  id: string
  created_at: string
  country: string
  city: string
  location_description: string | null
  display_name: string
  description: string | null
  image_url: string | null
  safety_score: number
  verdict: string
  color_detected: string | null
  contaminants: string[]
  health_risks: string[]
  needs_review: boolean
  language: string
}

type ReportSubmission = Omit<CommunityReport, 'id' | 'created_at' | 'needs_review'>

Export both types.

2. Create src/lib/supabase.ts using the pattern from the Supabase schema.
   Install @supabase/supabase-js if not already installed.
   
   Implement these 5 exported functions exactly as specified in the skill file:
   - supabase (the client instance)
   - getReports(options?)
   - getReportById(id)
   - submitReport(report)
   - getCityReportCount(country, city)
   - subscribeToReports(callback, filter?)

3. Add to .env.local:
   NEXT_PUBLIC_SUPABASE_URL=paste_your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_key_here

4. Verify TypeScript compiles: no errors on the new files.
   Confirm the supabase client connects by adding a temporary test: call getReports() with limit:1 in a server component, log the result, then remove the test code.
```

**You know it worked when**: No TypeScript errors, Supabase returns empty array (no reports yet, which is correct)

---

## STEP 2 — Community Report API Routes
**Goal**: HTTP endpoints for listing and submitting reports

**Prompt**:
```
In the aquacheck project, create two API route files for community reports.

--- src/app/api/reports/route.ts ---
export const runtime = 'nodejs'
Import NextResponse from 'next/server'
Import getReports, submitReport from '../../../lib/supabase'
Import analyzeWaterImage from '../../../lib/gemini'

GET handler:
- Parse query params: country, city, limit (default 20), offset (default 0)
- Call getReports({ country, city, limit: parseInt(limit), offset: parseInt(offset) })
- Return 200: { success: true, data: reports, count: reports.length }
- On error: 500 with generic message

POST handler:
- Parse JSON body. Required fields: country, city, safety_score, verdict, imageBase64 (optional)
- Validate:
  - country and city: required, non-empty strings
  - safety_score: required, integer 1-10
  - verdict: required, non-empty string
  - display_name: optional, default to 'Anonymous' if missing
  - If imageBase64 provided: it must be a valid base64 string
- If imageBase64 is provided:
  - Call analyzeWaterImage(imageBase64, mimeType) to get AI analysis
  - Use the AI score and verdict (overrides user-provided values for safety)
  - Set needs_review = ai_analysis.score <= 2 (auto-flag very low scores for review)
- Build ReportSubmission object from validated data
- Call submitReport(reportData)
- Return 201: { success: true, data: newReport }
- On validation error: 400 with specific message
- On Supabase error: 500 with 'Could not save report. Please try again.'

--- src/app/api/reports/[id]/route.ts ---
export const runtime = 'nodejs'
GET handler:
- Get id from params
- Call getReportById(id)
- If null: 404, { success: false, error: 'Report not found' }
- If found: 200, { success: true, data: report }
```

**You know it worked when**: `curl -X GET localhost:3000/api/reports` returns `{ success: true, data: [], count: 0 }`

---

## STEP 3 — i18n System
**Goal**: English/Urdu/Hindi language support across the whole app

**Prompt**:
```
In the aquacheck project, add a simple custom i18n system (no external library — keeps it lightweight).

1. Create the three translation files from the i18n schema:
   - messages/en.json (full English translations)
   - messages/ur.json (full Urdu translations)
   - messages/hi.json (full Hindi translations)
   Copy the exact JSON content from the skill file for all three.

2. Create src/lib/locale.ts as a 'use client' module with:
   - Type Locale = 'en' | 'ur' | 'hi'
   - translations object that imports all three JSON files
   - LocaleProvider component (React context provider)
     - Reads saved locale from localStorage on mount
     - Sets dir="rtl" on <html> when locale is 'ur'
     - Sets lang attribute on <html> to the locale code
   - useLocale() hook that returns { locale, setLocale }
   - useT() hook that returns a translator function t(key: string): string
     - Keys use dot notation: 'nav.photoCheck', 'upload.analyzeButton', etc.
     - Falls back to the key string itself if translation not found

3. Wrap src/app/layout.tsx with LocaleProvider:
   - Import LocaleProvider from '../lib/locale' (adjust path)
   - Wrap {children} with <LocaleProvider>{children}</LocaleProvider>
   - This must be a client component wrapper — create src/components/Providers.tsx as the 'use client' wrapper and use it in the server layout.tsx

4. Update src/components/NavTabs.tsx to use useT():
   - Import useT from '../lib/locale'
   - Replace all hardcoded tab label strings with t('nav.photoCheck') etc.
   - This proves the system works end to end

Do NOT touch any other components yet — we'll update them in Step 4.
TypeScript strict — no any types.
```

**You know it worked when**: NavTabs renders in English by default, and if you manually call setLocale('ur') from browser console it switches to Urdu

---

## STEP 4 — Language Switcher + Update All Components
**Goal**: Visible language toggle, all components translated

**Prompt**:
```
In the aquacheck project, create the LanguageSwitcher and update all components to use translations.

--- src/components/LanguageSwitcher.tsx ---
'use client' component.
Import useLocale from '../lib/locale'

Render three buttons side by side in a compact pill group (same segmented control pattern as NavTabs but smaller):
- "EN" → setLocale('en')
- "اردو" → setLocale('ur')  
- "हिंदी" → setLocale('hi')

Active locale: white bg, blue text, shadow
Inactive: transparent, slate-400

Add to the header in src/app/layout.tsx (or a shared Header component): position top-right corner, absolute or flex justify-end.

--- Update ALL components to use useT() ---

For each of these files, replace every hardcoded English string with the appropriate t('section.key') call. Import useT from '../lib/locale' at the top of each component. Add 'use client' if not already present.

Files to update:
1. UploadZone.tsx — use t('upload.*') keys
2. WaterChecker.tsx — use t('upload.*') and t('errors.*') keys
3. ScoreCard.tsx — use t('score.*') keys
4. CitySearch.tsx — use t('city.*') keys
5. CityReport.tsx — use t('city.*') keys
6. CityChecker.tsx — use t('city.*') and t('errors.*') keys
7. MapExplorer.tsx — use t('map.*') keys

For each component, the pattern is:
- Add: const t = useT()
- Replace: "Analyze Water Safety" → t('upload.analyzeButton')
- Replace: "No data available" → t('errors.genericError')
etc.

Do them one file at a time, confirm no errors after each.

Also add Urdu font support in globals.css:
When locale is 'ur', apply Noto Nastaliq Urdu font. Add the Google Fonts import for it.
Since we can't do this with just Tailwind, add a useEffect in LocaleProvider that adds/removes a class 'locale-ur' on <body> when locale changes, then in globals.css: body.locale-ur { font-family: 'Noto Nastaliq Urdu', serif; }
```

**You know it worked when**: Switch to اردو → all nav tabs, buttons, labels change to Urdu text + RTL layout

---

## STEP 5 — ReportForm Component
**Goal**: Form to submit a community water report

**Prompt**:
```
In the aquacheck project, create src/components/ReportForm.tsx

'use client' component.
Import useT from '../lib/locale'
Import listCountries, getCitiesInCountry from '../lib/cityData'
Import CommunityReport from '../types/report'

Props:
- onSuccess: (report: CommunityReport) => void
- onCancel: () => void

State:
- phase: 'form' | 'submitting' | 'success' | 'error'
- formData: { displayName, country, city, locationDescription, description }
- imageData: { base64, mimeType, previewUrl } | null
- errorMessage: string

Build a form (NOT using <form> HTML tag — use div + onClick handlers):

SECTIONS:

1. Photo upload (required):
   Mini UploadZone-style area (same dashed border, smaller: h-36)
   If image selected: show preview thumbnail (60x60px, rounded, object-cover) + filename + "Remove" link
   Label: t('community.photoLabel')

2. Location fields (2-column grid on md+, stacked on mobile):
   - Country select (same style as CitySearch) — required
   - City select (same style, populated by country selection) — required

3. Name field:
   - Text input, placeholder: t('community.namePlaceholder') = "Anonymous"
   - label: t('community.nameLabel')

4. Location description (optional):
   - Text input, placeholder: t('community.locationPlaceholder')
   - label: t('community.locationLabel')

5. Additional notes (optional):
   - Textarea (3 rows), placeholder: t('community.descriptionPlaceholder')
   - label: t('community.descriptionLabel')

6. Submit button (full width, blue-600):
   - Text: t('community.submitButton') when idle
   - Text: t('community.submitting') + spinner when submitting
   - Disabled when: no image selected, or country/city empty, or submitting

7. Cancel link below: "Cancel" in slate-400, onClick: onCancel

ON SUBMIT:
- Set phase 'submitting'
- POST to /api/reports with:
  {
    country, city,
    location_description: locationDescription || null,
    display_name: displayName || 'Anonymous',
    description: description || null,
    imageBase64: imageData?.base64,
    mimeType: imageData?.mimeType,
    safety_score: 5,   // will be overridden by server-side AI analysis
    verdict: 'PENDING',
    contaminants: [],
    health_risks: [],
    language: locale   // from useLocale()
  }
- On 201 success: set phase 'success', call onSuccess(response.data)
- On error: set phase 'error', set errorMessage from response or generic

SUCCESS STATE: show checkmark (✓ in a green circle), t('community.successTitle'), t('community.successMessage')

ERROR STATE: red box with errorMessage, retry button (resets to form phase with data intact)

Full TypeScript, Tailwind only, no any.
```

**You know it worked when**: Form renders, validation works, submitting shows spinner, success state shows checkmark

---

## STEP 6 — ReportCard + ReportFeed with Real-time
**Goal**: Display reports and live-update when new ones come in

**Prompt**:
```
In the aquacheck project, create two components.

--- src/components/ReportCard.tsx ---
'use client'
Import CommunityReport from '../types/report'
Import getScoreColors, getScoreLabel from '../lib/scoring'
Import useT from '../lib/locale'

Props: { report: CommunityReport; isNew?: boolean }

A card with subtle box shadow (bg-white border border-slate-100 rounded-2xl p-4):

1. TOP ROW (flex justify-between items-start):
   Left: Display name (font-medium text-slate-700, text-sm) + location line (city, country in text-xs text-slate-400) + optional location_description in italic text-xs text-slate-400
   Right: Score badge (same small pill style as Phase 1, e.g. "3/10" in red bg) + time ago string (created_at formatted as "2 hours ago" using a simple time-diff function)

2. VERDICT (mt-2):
   Full-width verdict badge using getScoreColors — same style as Phase 1 ScoreCard but more compact (py-1 instead of py-2)

3. If contaminants.length > 0 (mt-2):
   Small contaminant pills, flex-wrap, same style as Phase 1

4. If description is not null (mt-2):
   Italic text-sm text-slate-500 — the user's note

5. isNew prop: if true, add a subtle pulse border animation (ring-2 ring-blue-400 ring-offset-1) that fades after 3 seconds via setTimeout in useEffect

Time-ago helper (create inline in the file):
function timeAgo(dateStr: string): string — returns "just now", "5 minutes ago", "2 hours ago", "3 days ago"

--- src/components/ReportFeed.tsx ---
'use client'
Import getReports, subscribeToReports from '../lib/supabase'
Import CommunityReport from '../types/report'
Import ReportCard from './ReportCard'
Import useT from '../lib/locale'
Import { useState, useEffect, useRef } from 'react'

Props: { filterCountry?: string; filterCity?: string }

State:
- reports: CommunityReport[] = []
- isLoading: boolean = true
- newReportIds: Set<string> = new Set() — tracks which are newly arrived via real-time
- hasMore: boolean = false

On mount:
1. Fetch initial reports (limit 10) with optional country/city filter
2. Set isLoading false, set hasMore if count === 10
3. Subscribe to real-time new reports via subscribeToReports():
   When a new report arrives:
   - Prepend to reports array (unshift)
   - Add its id to newReportIds
   - After 4 seconds, remove from newReportIds (so pulse animation ends)
4. Unsubscribe on unmount

"Load more" button (if hasMore):
- Fetches next 10 with offset = current reports.length
- Appends to reports array

Render:
- isLoading: 3x ReportCard skeleton (animate-pulse gray boxes, same card height)
- reports.length === 0: t('community.noReports') centered in slate-400
- reports.length > 0: 
  - Small "🟢 t('community.liveLabel')" badge top-right (shows real-time is active)
  - Stack of <ReportCard report={r} isNew={newReportIds.has(r.id)} /> for each report
  - "Load more" button at bottom if hasMore

Full TypeScript, no any.
```

**You know it worked when**: Feed loads existing reports, real-time: open two browser tabs, submit in one, it appears in the other within 2 seconds

---

## STEP 7 — Community Page + CommunityMap
**Goal**: The full community tab with map + feed + submit form

**Prompt**:
```
In the aquacheck project, create the community page and map.

--- src/components/CommunityMap.tsx ---
'use client'
Import from 'react-simple-maps': ComposableMap, Geographies, Geography, Marker
Import { useState, useEffect } from 'react'
Import getReports from '../lib/supabase'
Import getScoreColors from '../lib/scoring'
Import CommunityReport from '../types/report'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

City coordinates: same CITY_COORDS map as WorldMap.tsx from Phase 3

State:
- reportsByCity: Map<string, { count: number; avgScore: number; lat: number; lng: number }>
- selectedCity: string | null

On mount: fetch all reports (limit 100), group by city, compute count + average score per city.

Render map (same styles as Phase 3 WorldMap, height h-48 md:h-64):
- Gray world geography
- For each city that has reports: show a Marker
  - Circle radius proportional to report count (min r=5, max r=14)
  - Fill color: getScoreColors(Math.round(avgScore)).hex
  - Label: city name in tiny text (fontSize=8) below circle
  - On click: setSelectedCity(cityName)
- If selectedCity: small overlay card showing city name + report count + avg score

Map legend: same as Phase 3 WorldMap (Safe/Caution/Unsafe colored dots)

--- src/app/community/page.tsx ---
Server component.
Same header as other pages.
<NavTabs /> (will now show 4 tabs)

Below: <CommunityExplorer /> client component

--- src/components/CommunityExplorer.tsx ---
'use client'
Import ReportForm, ReportFeed, CommunityMap from their files
Import useT from '../lib/locale'
Import { useState } from 'react'
Import CommunityReport from '../types/report'

State:
- view: 'feed' | 'submit'
- newSubmission: CommunityReport | null

Layout:

HEADER SECTION:
- t('community.title') as h2 (text-xl font-bold text-slate-800)
- t('community.subtitle') in text-sm text-slate-400

COMMUNITY MAP (always visible, shows report density):
- <CommunityMap /> (compact height)

ACTION ROW (flex, space-between, mt-4 mb-4):
- Left: "t('community.recentTitle')" heading (text-base font-semibold text-slate-700)
- Right: if view === 'feed': blue outlined button "t('community.submitTitle')" → setView('submit')
         if view === 'submit': link "← Back" → setView('feed')

CONTENT:
- if view === 'feed': <ReportFeed />
- if view === 'submit': 
    <ReportForm
      onSuccess={(report) => { setNewSubmission(report); setView('feed'); }}
      onCancel={() => setView('feed')}
    />

--- Update NavTabs.tsx ---
Add 4th tab: "👥 t('nav.community')" → href='/community'
Same segmented control, now 4 equal segments.
On mobile: even smaller text (text-[11px]) or use icons only on mobile with labels below (optional).
```

**You know it worked when**: Community tab shows map + report feed + submit form toggle works

---

## STEP 8 — PWA Setup
**Goal**: App installable on phone like a native app

**Prompt**:
```
In the aquacheck project, set up PWA support following the PWA setup guide.

1. Update next.config.js with the next-pwa wrapper and caching config from the skill file.
   If next.config.js is TypeScript (.ts), convert to .js or use the JS config pattern — next-pwa requires next.config.js.

2. Create public/manifest.json with the exact content from pwa.md.

3. Update src/app/layout.tsx metadata with the PWA meta fields from pwa.md.
   Add the apple-touch-icon link tag and apple mobile web app meta tags.

4. Create src/components/InstallPrompt.tsx:
   'use client' component.
   Import useT from '../lib/locale'
   Import { isIOS, isInStandaloneMode } from a new file src/lib/pwa.ts
   
   Create src/lib/pwa.ts with:
   - isIOS(): boolean
   - isInStandaloneMode(): boolean
   - BeforeInstallPromptEvent type definition (extends Event with prompt() method and userChoice promise)
   
   InstallPrompt logic (from pwa.md skill):
   - Listen for beforeinstallprompt event (Android Chrome)
   - On iOS: show banner if isIOS() && !isInStandaloneMode()
   - Show a bottom banner: blue-600 bg, text-white, t('install.banner')
     - "Add to Home Screen" button → triggers install or shows iOS instruction
     - "✕" dismiss button → hides banner, saves 'aquacheck-pwa-dismissed' to localStorage
     - Don't show if localStorage has 'aquacheck-pwa-dismissed'
   - iOS instruction (when isIOS()): "Tap Share (⬆) then 'Add to Home Screen'"

5. Add <InstallPrompt /> at the bottom of layout.tsx (inside body, outside main content)

6. Add to .gitignore: public/sw.js, public/workbox-*.js (auto-generated by next-pwa)

7. For PWA icons: create simple placeholder icons for now.
   Create a script scripts/generate-icons.ts that uses the 'sharp' package to create:
   - A 192x192 blue (#1A6FE8) square with a white water drop SVG path drawn on it
   - A 512x512 version
   Save both to public/ folder.
   Run with: npm install sharp && npx tsx scripts/generate-icons.ts

8. Run npm run build — PWA should build without errors.
   Show full build output.
```

**You know it worked when**: Build passes, visiting on Chrome Android shows "Add to Home Screen" prompt, iOS shows banner

---

## STEP 9 — Polish + Final Touches
**Goal**: Make Phase 4 production-quality

**Prompt**:
```
In the aquacheck project, add these Phase 4 polish items:

1. Report count badge in NavTabs community tab:
   Fetch total report count from /api/reports?limit=0 (just the count) on mount
   Show a small red badge with count: "👥 Community (12)"
   Cache the count in sessionStorage so it doesn't re-fetch on every tab switch

2. In ReportFeed, add a simple city filter:
   A small input field above the feed: "Filter by city" placeholder (t('community.filterByCity'))
   Typing filters reports client-side first (immediate), then re-fetches server-side after 500ms debounce

3. In ReportCard, add a "Report inappropriate" link (text-xs text-slate-300 underline at bottom):
   On click: POST /api/reports/{id}/flag (create this simple route — it just sets needs_review=true in Supabase)
   Show "Reported" text after click. No confirmation needed.
   Create src/app/api/reports/[id]/route.ts PATCH handler for this.

4. Urdu RTL layout fix:
   In globals.css, add: [dir="rtl"] .flex { flex-direction: row-reverse; }
   And: [dir="rtl"] .text-left { text-align: right; }
   This auto-flips layouts when Urdu is active without changing component code.

5. Run npm run build — fix all TypeScript errors.
   If next-pwa causes build issues with TypeScript, rename next.config.ts to next.config.js and use the CommonJS require syntax from pwa.md.
   Show full build output — it must be 0 errors.
```

**You know it worked when**: `npm run build` shows 0 errors, Urdu layout is RTL

---

## STEP 10 — Test + Deploy
**Goal**: Full Phase 4 verification and live deployment

**Prompt**:
```
In the aquacheck project, test and deploy Phase 4.

1. Create scripts/test-phase4.ts:
   Test these, print PASS/FAIL:
   - GET /api/reports → expect 200 + data array
   - POST /api/reports (missing country) → expect 400
   - POST /api/reports (valid data, no image) → expect 201 + id in response
   - GET /api/reports/{new_id} → expect 200 + report data
   - GET /api/reports?city=Karachi → expect 200 (may be empty array, that's fine)
   Run with: npx tsx scripts/test-phase4.ts

2. Manual test checklist — print this for me to follow:
   LANGUAGE:
   - [ ] Default language is English
   - [ ] Switch to Urdu → all UI text changes, layout flips RTL
   - [ ] Switch to Hindi → all UI text changes, layout stays LTR
   - [ ] Language persists after page refresh
   
   COMMUNITY:
   - [ ] Community tab loads with map + empty feed
   - [ ] "Submit Report" shows the form
   - [ ] Form validates: can't submit without photo, country, city
   - [ ] Submit with a real water photo → 201 success, checkmark shown
   - [ ] New report appears in feed after success
   - [ ] Open in second browser tab: submit in tab 1, appears in tab 2 within 3 seconds (real-time)
   
   PWA:
   - [ ] manifest.json accessible at /manifest.json
   - [ ] On Android Chrome: install banner appears after 30 seconds
   - [ ] On iOS Safari: custom banner appears with Share instructions
   - [ ] After install: app opens fullscreen without browser chrome
   
   ALL TABS:
   - [ ] Photo Check still works
   - [ ] City Check still works with charts
   - [ ] World Map still works with markers
   - [ ] Community tab shows all sections

3. Deploy:
   Add to Vercel environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   git add, commit "Add Phase 4: community reports, PWA, Urdu/Hindi support", push
   Confirm Vercel deployment succeeds (check build logs for any PWA-related warnings)
   Test live URL on a real phone — both install prompt and report submission

4. Final check: open Chrome DevTools → Application tab → Service Workers
   Confirm SW is registered. Application → Manifest: confirm all fields load.
```

---

## Files created/changed in Phase 4
```
messages/
├── en.json          NEW
├── ur.json          NEW
└── hi.json          NEW

public/
├── manifest.json    NEW
├── icon-192.png     NEW
└── icon-512.png     NEW

src/
├── app/
│   ├── layout.tsx            UPDATED (PWA meta + Providers)
│   ├── community/page.tsx    NEW
│   └── api/reports/
│       ├── route.ts          NEW (GET + POST)
│       └── [id]/route.ts     NEW (GET + PATCH flag)
├── components/
│   ├── NavTabs.tsx           UPDATED (4 tabs + report count badge)
│   ├── UploadZone.tsx        UPDATED (translated)
│   ├── WaterChecker.tsx      UPDATED (translated)
│   ├── ScoreCard.tsx         UPDATED (translated)
│   ├── CitySearch.tsx        UPDATED (translated)
│   ├── CityReport.tsx        UPDATED (translated)
│   ├── CityChecker.tsx       UPDATED (translated)
│   ├── MapExplorer.tsx       UPDATED (translated)
│   ├── Providers.tsx         NEW
│   ├── LanguageSwitcher.tsx  NEW
│   ├── ReportForm.tsx        NEW
│   ├── ReportCard.tsx        NEW
│   ├── ReportFeed.tsx        NEW
│   ├── CommunityMap.tsx      NEW
│   ├── CommunityExplorer.tsx NEW
│   └── InstallPrompt.tsx     NEW
├── lib/
│   ├── supabase.ts           NEW
│   ├── locale.ts             NEW
│   └── pwa.ts                NEW
└── types/
    └── report.ts             NEW

next.config.js     UPDATED (next-pwa)
scripts/
├── generate-icons.ts  NEW
└── test-phase4.ts     NEW
```

## After Phase 4 — AquaCheck is complete
All 4 phases live. App has:
- ✅ AI water photo analysis (Gemini Vision)
- ✅ 15-city water quality database with charts
- ✅ Interactive world map
- ✅ Community report system with real-time updates (Supabase)
- ✅ Installable PWA (works on any phone like a native app)
- ✅ English + Urdu + Hindi language support
- ✅ 100% free to run — no paid services
```
