# Phase 1 — Image Analyzer MVP
## Complete Build Plan

**Goal**: Working web app — user uploads water photo, gets safety score + verdict + health risks
**AI**: Google Gemini 1.5 Flash (free)
**Estimated time**: 4–6 hours
**End result**: Live on Vercel, shareable URL

---

---

## STEP 1 — Project Setup
**Goal**: Working Next.js project with correct config

**Prompt**:
```
Create a new Next.js 14 project in the current folder called "aquacheck" using the App Router. Configure with: TypeScript, Tailwind CSS, ESLint. Use the default options for everything else.

After creating it, do these:
1. Install this package: @google/generative-ai
2. Create .env.local containing exactly: GEMINI_API_KEY=your_key_here
3. Make sure .gitignore includes: .env.local, .env, node_modules
4. Update tailwind.config.ts to extend colors with:
   - primary: '#1A6FE8'
   - 'water-safe': '#10B981'
   - 'water-caution': '#F59E0B'
   - 'water-danger': '#EF4444'
5. Replace contents of src/app/globals.css with only these 3 lines:
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
6. Replace src/app/page.tsx with a simple component that renders:
   <main><h1 className="text-2xl text-blue-600">AquaCheck</h1></main>

Then run npm run dev and confirm it works. Show me the full project folder structure.
```

**You know it worked when**: `npm run dev` shows "AquaCheck" at localhost:3000

---

## STEP 2 — TypeScript Types
**Goal**: Define all data shapes before writing logic

**Prompt**:
```
In the aquacheck project, create the file src/types/analysis.ts

Define these TypeScript types (export all of them):

1. WaterAnalysis interface with these fields:
   - score: number
   - verdict: 'SAFE TO DRINK' | 'CAUTION - BOIL FIRST' | 'NOT SAFE TO DRINK' | 'DANGEROUS'
   - color_detected: string
   - turbidity: 'CLEAR' | 'SLIGHTLY CLOUDY' | 'CLOUDY' | 'VERY CLOUDY' | 'OPAQUE'
   - sediment: 'NONE' | 'SLIGHT' | 'MODERATE' | 'HEAVY'
   - foam: 'NONE' | 'SLIGHT' | 'SIGNIFICANT'
   - likely_contaminants: string[]
   - health_risks: string[]
   - recommendation: string
   - analysis_confidence: 'HIGH' | 'MEDIUM' | 'LOW'
   - disclaimer: string

2. AnalysisRequest interface:
   - imageBase64: string
   - mimeType: 'image/jpeg' | 'image/png' | 'image/webp'

3. AnalysisResponse as a discriminated union type:
   - { success: true; data: WaterAnalysis }
   - { success: false; error: string }

4. ScoreLevel type: 'safe' | 'caution' | 'danger'

Also create src/lib/scoring.ts with these exported functions (no external dependencies):
- getScoreLevel(score: number): ScoreLevel — returns 'safe' if >=8, 'caution' if >=5, 'danger' otherwise
- getScoreLabel(score: number): string — returns 'Excellent'|'Good'|'Caution'|'Poor'|'Dangerous'
- getScoreColors(score: number): object with fields: bg, border, text, badge, hex (all strings)
  - safe: bg='bg-emerald-50', border='border-emerald-200', text='text-emerald-700', badge='bg-emerald-100 text-emerald-800', hex='#10B981'
  - caution: bg='bg-amber-50', border='border-amber-200', text='text-amber-700', badge='bg-amber-100 text-amber-800', hex='#F59E0B'
  - danger: bg='bg-red-50', border='border-red-200', text='text-red-700', badge='bg-red-100 text-red-800', hex='#EF4444'

No any types. Check for TypeScript errors.
```

**You know it worked when**: No red underlines in VS Code on these files

---

## STEP 3 — Gemini AI Integration
**Goal**: The function that sends a water image to Gemini and gets analysis back

**Prompt**:
```
In the aquacheck project, create src/lib/gemini.ts

This file wraps the Google Gemini API for water image analysis. Use @google/generative-ai package.

The file should:

1. Import GoogleGenerativeAI from '@google/generative-ai'
2. Import WaterAnalysis from '../types/analysis'
3. Create the Gemini client and model at module level:
   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

4. Export this function:
   export async function analyzeWaterImage(imageBase64: string, mimeType: string): Promise<WaterAnalysis>

   Inside the function:
   a. Check GEMINI_API_KEY exists, throw Error('NO_API_KEY') if not
   b. Create imagePart: { inlineData: { data: imageBase64, mimeType: mimeType } }
   c. Use this EXACT prompt text (copy word for word):

"You are a water quality expert analyzing a water sample photo. Respond ONLY with valid JSON. No markdown, no explanation, no text outside the JSON object.

Examine the image carefully for: water color, turbidity (cloudiness), visible sediment or particles, foam or bubbles, surface film or sheen.

Return exactly this JSON structure with no extra fields:
{
  \"score\": <integer 1-10>,
  \"verdict\": \"<one of exactly: SAFE TO DRINK | CAUTION - BOIL FIRST | NOT SAFE TO DRINK | DANGEROUS>\",
  \"color_detected\": \"<describe the color in plain English>\",
  \"turbidity\": \"<one of exactly: CLEAR | SLIGHTLY CLOUDY | CLOUDY | VERY CLOUDY | OPAQUE>\",
  \"sediment\": \"<one of exactly: NONE | SLIGHT | MODERATE | HEAVY>\",
  \"foam\": \"<one of exactly: NONE | SLIGHT | SIGNIFICANT>\",
  \"likely_contaminants\": [\"<contaminant>\"],
  \"health_risks\": [\"<risk>\", \"<risk>\", \"<risk>\"],
  \"recommendation\": \"<one clear sentence — what should the person do with this water>\",
  \"analysis_confidence\": \"<one of exactly: HIGH | MEDIUM | LOW>\",
  \"disclaimer\": \"This is an AI visual analysis only. For certified results, use a professional water testing kit.\"
}

Scoring: 9-10=crystal clear safe, 7-8=mostly clear, 5-6=cloudy/colored, 3-4=clearly contaminated, 1-2=severely polluted. Be conservative — when in doubt score lower."

   d. Call: const result = await model.generateContent([prompt, imagePart])
   e. Get text: const text = result.response.text()
   f. Clean markdown if present: text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
   g. Parse JSON and return as WaterAnalysis
   h. Catch JSON.parse errors and throw Error('INVALID_JSON')

No any types. Handle all errors explicitly.
```

**You know it worked when**: Function exists with correct TypeScript types, no errors

---

## STEP 4 — API Route
**Goal**: HTTP endpoint that receives image and returns analysis

**Prompt**:
```
In the aquacheck project, create src/app/api/analyze/route.ts

This is a Next.js 14 App Router route handler.

Requirements:
1. Add at top: export const runtime = 'nodejs'
2. Import NextResponse from 'next/server'
3. Import analyzeWaterImage from '../../../lib/gemini'
4. Import AnalysisResponse from '../../../types/analysis'

5. Export async function POST(request: Request):
   
   a. Parse body: const body = await request.json() — wrap in try/catch, return 400 if fails
   
   b. Destructure: const { imageBase64, mimeType } = body
   
   c. Validate (return 400 for each failure with specific message):
      - !imageBase64 → "Please provide an image to analyze"
      - typeof imageBase64 !== 'string' → "Invalid image data"
      - !['image/jpeg','image/png','image/webp'].includes(mimeType) → "Please upload a JPG, PNG, or WebP image"
      - Buffer.from(imageBase64, 'base64').length > 5 * 1024 * 1024 → 413 status, "Image too large. Please use an image under 5MB"
   
   d. Call analyzeWaterImage(imageBase64, mimeType) inside try/catch
   
   e. On success: return NextResponse.json({ success: true, data: result })
   
   f. On error, check error.message:
      - 'RATE_LIMIT' or message includes '429' → 429, "Too many requests. Please wait and try again"
      - 'INVALID_JSON' → 500, "Could not read the analysis. Please try again"
      - 'NO_API_KEY' → 500, "Server configuration error"
      - anything else → 500, "Analysis failed. Please try again"

Never log imageBase64. Always return JSON.
```

**You know it worked when**:
`curl -X POST localhost:3000/api/analyze -H "Content-Type: application/json" -d '{}'`
returns `{"success":false,"error":"Please provide an image to analyze"}`

---

## STEP 5 — UploadZone Component
**Goal**: Drag-and-drop image upload UI

**Prompt**:
```
In the aquacheck project, create src/components/UploadZone.tsx

This is a React client component ('use client' at top).

Props interface UploadZoneProps:
- onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void
- isLoading: boolean

Build a drag-and-drop upload zone:

1. Outer div: dashed border (border-2 border-dashed), rounded-2xl, p-12, text-center, cursor-pointer
   - Default: border-blue-300 bg-white
   - Hover state (isDragging or mouse hover): border-blue-500 bg-blue-50
   - Transition on all color changes

2. Inside when NOT loading:
   - A water drop SVG icon (simple teardrop: a circle at bottom + pointed top, 48x48, text-blue-400)
   - Text: "Drop your water photo here" (text-lg font-medium text-slate-700 mt-4)
   - Text: "or click to upload" (text-sm text-slate-400 mt-1)
   - Text: "JPG, PNG or WebP — max 5MB" (text-xs text-slate-300 mt-1)

3. Inside when isLoading:
   - Spinning circle SVG animation (CSS animate-spin, 48x48, blue)
   - Text: "Analyzing..." (text-slate-500)
   - pointer-events-none on outer div

4. Hidden file input: accept="image/jpeg,image/png,image/webp", ref attached
   Clicking anywhere on the zone triggers input.click()

5. Drag events on outer div:
   - onDragOver: preventDefault, setIsDragging(true)
   - onDragLeave: setIsDragging(false)
   - onDrop: preventDefault, setIsDragging(false), handle file

6. On file selected (both click and drop):
   a. Check file.type is image/jpeg, image/png, or image/webp — if not, setError("Please upload a JPG, PNG, or WebP image")
   b. Check file.size <= 5 * 1024 * 1024 — if not, setError("Image must be under 5MB")
   c. Convert to base64 with FileReader.readAsDataURL, strip the data:...;base64, prefix
   d. Create preview with URL.createObjectURL(file)
   e. Call onImageSelected(base64, file.type, previewUrl)

7. Error message: red text (text-red-500 text-sm mt-3) shown below zone when error exists

Use useState for: isDragging (boolean), error (string | null).
Full TypeScript. Tailwind only. No external icon libraries.
```

**You know it worked when**: Zone renders, clicking opens file picker, drag-over changes border color

---

## STEP 6 — ScoreCard Component
**Goal**: Full results display

**Prompt**:
```
In the aquacheck project, create src/components/ScoreCard.tsx

Props: { analysis: WaterAnalysis } — import WaterAnalysis from '../types/analysis'
Also import getScoreColors and getScoreLabel from '../lib/scoring'

Build a results card with these sections in order:

1. SCORE CIRCLE (centered, mt-6 mb-4):
   SVG 120x120. Outer circle (gray-200 stroke, 8px width, no fill). Inner arc that fills based on score:
   - circumference = 2 * Math.PI * 50 (radius 50)
   - dashOffset = circumference - (score/10 * circumference)
   - strokeDasharray={circumference} strokeDashoffset={dashOffset}
   - stroke color = getScoreColors(score).hex
   - Add CSS transition: transition-all duration-1000
   Score number inside (text-4xl font-bold, color from getScoreColors)
   "/ 10" below in text-slate-400 text-sm
   Label (Excellent/Good/etc) below that in text-sm font-medium

2. VERDICT BADGE (full width, rounded-xl, p-3, text-center, mb-4):
   Background and text from getScoreColors(score).badge
   Verdict text in font-bold text-lg
   Map verdict to emoji prefix: SAFE=✓, CAUTION=⚠, NOT SAFE=✗, DANGEROUS=☠

3. DETAILS GRID (2 columns, gap-3, mb-4):
   4 small cards (bg-slate-50, rounded-lg, p-3):
   - Color detected
   - Turbidity  
   - Sediment
   - Foam
   Each card: label (text-xs text-slate-400 uppercase tracking-wide), value (text-sm font-medium text-slate-700 mt-1)

4. CONTAMINANTS section (mb-4):
   Heading: "Likely Contaminants" (text-sm font-semibold text-slate-600 mb-2)
   If empty: show "None detected" in text-slate-400
   Each contaminant: pill (bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full)
   flex flex-wrap gap-2

5. HEALTH RISKS section (mb-4):
   Heading: "⚠ Health Risks" (text-sm font-semibold text-red-600 mb-2)
   If empty: show "No significant risks detected" in text-slate-400
   Each risk: text-sm text-red-700 with red bullet point (● ) before it
   Space-y-1

6. RECOMMENDATION box (mb-4):
   border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4
   Heading: "What to do" (text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1)
   Recommendation text: text-sm text-slate-700

7. CONFIDENCE + DISCLAIMER (bottom):
   Confidence: text-xs text-slate-400, "Analysis confidence: HIGH/MEDIUM/LOW"
   Color: HIGH=emerald, MEDIUM=amber, LOW=red
   Disclaimer: text-xs text-slate-300 italic mt-2

Full TypeScript. No any. Tailwind only.
```

**You know it worked when**: Paste mock data and all 7 sections render correctly

---

## STEP 7 — WaterChecker + Main Page
**Goal**: Tie everything together — the full working app

**Prompt**:
```
In the aquacheck project, create src/components/WaterChecker.tsx and update src/app/page.tsx

--- WaterChecker.tsx ---
This is a 'use client' component. It is the main state machine of the app.

State:
- phase: 'upload' | 'preview' | 'loading' | 'result' | 'error'
- imageData: { base64: string; mimeType: string; previewUrl: string } | null
- analysis: WaterAnalysis | null
- errorMessage: string
- loadingStep: number (0, 1, 2 — for progress display)

Import: UploadZone, ScoreCard from their files. WaterAnalysis from types. getScoreColors from lib/scoring.

Render logic based on phase:

PHASE 'upload':
  <UploadZone onImageSelected={handleImageSelected} isLoading={false} />

PHASE 'preview':
  - img tag showing imageData.previewUrl (max-h-64, w-full, object-cover, rounded-xl)
  - Button "Analyze Water Safety" (w-full, bg-blue-600 hover:bg-blue-700, text-white, py-3, rounded-xl, text-base font-semibold, mt-4) → calls handleAnalyze
  - Button/link "Choose a different photo" (text-sm text-slate-400, mt-2, block text-center) → resets to upload phase

PHASE 'loading':
  - Centered spinner (animate-spin SVG, 40px, blue-600)
  - 3 loading steps shown as text list:
    ['Reading your image...', 'Analyzing water quality...', 'Preparing your report...']
    Current step (loadingStep index) is bold + blue, others are gray
  - Use useEffect with setTimeout(1500ms, 3000ms) to advance loadingStep
  
PHASE 'result':
  - <ScoreCard analysis={analysis!} />
  - "Share Result" button:
    Copies this text to clipboard: "My water scored {score}/10 on AquaCheck — {verdict}. {recommendation} Check yours at aquacheck.vercel.app"
    After copying: button text = "Copied! ✓" for 2 seconds, then resets
    Style: w-full border border-slate-200 text-slate-600 py-2 rounded-xl text-sm mt-4
  - "Check another photo" button:
    Resets all state back to upload phase, revokes preview URL
    Style: w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-sm mt-2

PHASE 'error':
  - Red box (bg-red-50 border border-red-200 rounded-xl p-4)
  - Error message text (text-red-700 text-sm)
  - "Try again" button → resets to upload phase

handleImageSelected: sets imageData, changes phase to 'preview'

handleAnalyze:
  - Set phase to 'loading', loadingStep to 0
  - POST to '/api/analyze' with { imageBase64: imageData.base64, mimeType: imageData.mimeType }
  - On success (response.data): set analysis, phase to 'result'
  - On error: set errorMessage from response.error or "Something went wrong", phase to 'error'
  - Catch network errors: set errorMessage "Network error. Check your connection.", phase to 'error'

--- page.tsx ---
Replace with a server component (no 'use client'):

Layout:
- min-h-screen bg-slate-50
- Header: centered, pt-12 pb-6
  - Water drop SVG (32px, blue-600) + "AquaCheck" (text-2xl font-bold text-blue-600) side by side
  - Tagline: "Know if your water is safe to drink" (text-sm text-slate-400 mt-1, centered)
- Main: max-w-lg mx-auto px-4 pb-20
  - <WaterChecker />
- Footer: text-center py-8 space-y-1
  - "Powered by Gemini AI" (text-xs text-slate-300)
  - "⚠ Not a substitute for professional water testing" (text-xs text-slate-300)
```

**You know it worked when**: Full flow — upload photo → preview → analyze → see results

---

## STEP 8 — Polish
**Goal**: Production-ready quality

**Prompt**:
```
In the aquacheck project, add these final polish items:

1. src/app/layout.tsx — add proper metadata:
   export const metadata = {
     title: 'AquaCheck — AI Water Safety Checker',
     description: 'Upload a photo of your water and find out if it is safe to drink. AI-powered water quality analysis in seconds.',
   }
   Add viewport meta. Keep existing body/html structure.

2. Score circle animation in ScoreCard:
   Wrap the SVG arc in a React useEffect that sets the strokeDashoffset after mount (0 → calculated value). This creates a fill-in animation on load. Import useState and useEffect.

3. Add loading skeleton to show WHILE the real ScoreCard loads after API responds:
   Actually this is not needed — the loading phase already shows the spinner.
   Instead, add a subtle fade-in animation to ScoreCard on mount:
   Add className="animate-fade-in" and define this in globals.css:
   @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
   .animate-fade-in { animation: fadeIn 0.4s ease-out; }

4. Make sure all buttons have minimum height of 44px for mobile tap targets.

5. Run: npm run build
   Fix any TypeScript errors or build warnings that appear.
   Show me the full output of npm run build.
```

**You know it worked when**: `npm run build` shows "✓ Compiled successfully" with 0 errors

---

## STEP 9 — Deploy to Vercel
**Goal**: Live URL

**Prompt**:
```
Help me deploy the aquacheck project to Vercel. Do these steps:

1. Create vercel.json at the project root:
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}

2. Create README.md with:
   # AquaCheck
   AI-powered water safety checker using Google Gemini Vision.
   
   ## Run locally
   1. Clone this repo
   2. Create .env.local with: GEMINI_API_KEY=your_key
      Get free key at: https://aistudio.google.com/app/apikey
   3. npm install
   4. npm run dev
   
   ## Tech stack
   Next.js 14 • TypeScript • Tailwind CSS • Google Gemini 1.5 Flash (free)

3. Give me exact terminal commands in order:
   a. Initialize git and make first commit
   b. Create GitHub repo and push (I will create the GitHub repo first — tell me what to name it)
   c. Deploy with Vercel CLI: npx vercel
   d. Set GEMINI_API_KEY in Vercel — exact steps in the Vercel dashboard

4. After deploying, give me the curl command to test the live API endpoint.
```

**You know it worked when**: You get a .vercel.app URL and can upload a photo on your phone

---

## STEP 10 — Test Everything
**Goal**: Confirm nothing is broken

**Prompt**:
```
Create a test script at scripts/test-api.ts for the aquacheck project.

The script should:
1. Test the /api/analyze endpoint locally (http://localhost:3000)
2. Run these test cases in sequence, print PASS or FAIL for each:
   - Empty body → expect 400
   - Missing imageBase64 → expect 400
   - Wrong mimeType (application/pdf) → expect 400
   - Valid structure but tiny fake base64 → expect 200 or 500 (Gemini may reject tiny fake images — both are acceptable)

Run with: npx tsx scripts/test-api.ts

Then give me a manual test checklist I can go through in the browser to verify the full app works correctly, covering: happy path, error cases, mobile layout, share button, and reset flow.
```

---

## Files created in Phase 1
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/analyze/route.ts
├── components/
│   ├── WaterChecker.tsx
│   ├── UploadZone.tsx
│   └── ScoreCard.tsx
├── lib/
│   ├── gemini.ts
│   └── scoring.ts
└── types/
    └── analysis.ts
scripts/
└── test-api.ts
vercel.json
README.md
.env.local
```
