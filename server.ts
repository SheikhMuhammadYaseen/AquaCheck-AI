/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { analyzeWaterImage, getCitySummary, getCityProjectionNarrative, answerWaterQuery } from './src/lib/gemini.ts';
import { getCityData, calculateProjection, getRawWaterData, setCitiesInMemoryCache, updateCityInMemoryCache } from './src/lib/cityData.ts';
import { CommunityReport, ReportSubmission } from './src/types/report.ts';
import { CityWaterData } from './src/types/city.ts';
import { 
  isFirebaseEnabled, 
  getCityFromFirestore, 
  saveCityToFirestore, 
  getAllCitiesFromFirestore, 
  getReportsFromFirestore, 
  saveReportToFirestore 
} from './src/lib/firebase.ts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup directories and files
const DATA_DIR = path.join(process.cwd(), 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'community-reports.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify([], null, 2));
}

// Helpers for community reports database
function readReports(): CommunityReport[] {
  try {
    const content = fs.readFileSync(REPORTS_FILE, 'utf-8');
    return JSON.parse(content) as CommunityReport[];
  } catch (error) {
    console.error("Error reading community reports:", error);
    return [];
  }
}

function writeReports(reports: CommunityReport[]) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error("Error writing community reports:", error);
  }
}

// Middlewares - Support large payloads for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== API ROUTES ====================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Photo Analysis Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: "Please provide an image to analyze" });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ success: false, error: "Please upload a JPG, PNG, or WebP image" });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: "Image too large. Please use an image under 5MB" });
    }

    const result = await analyzeWaterImage(imageBase64, mimeType);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Express /api/analyze Error:", error);
    if (error?.message?.includes('429')) {
      return res.status(429).json({ success: false, error: "Too many requests. Please wait and try again" });
    }
    res.status(500).json({ success: false, error: error.message || "Analysis failed. Please try again" });
  }
});

// 3. City Database Search Route
app.get('/api/city', async (req, res) => {
  try {
    const { country, city } = req.query;

    if (!country || !city) {
      return res.status(400).json({ success: false, error: "Please provide both country and city" });
    }

    // Try to get freshest data from Firestore first
    if (isFirebaseEnabled()) {
      try {
        const firestoreCity = await getCityFromFirestore(country as string, city as string);
        if (firestoreCity) {
          updateCityInMemoryCache(firestoreCity);
        }
      } catch (dbErr) {
        console.error("[Database] Error querying city on lookup:", dbErr);
      }
    }

    const lookup = getCityData(country as string, city as string);

    if (!lookup.found) {
      return res.status(404).json({
        success: false,
        error: "No data available for this city yet",
        suggestions: (lookup as any).suggestions
      });
    }

    // Call Gemini to generate summary on demand
    const summary = await getCitySummary(lookup.data);
    res.json({ success: true, data: lookup.data, summary });
  } catch (error: any) {
    console.error("Express /api/city Error:", error);
    res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// 4. 10-Year Public Health Projection Route
app.get('/api/projection', async (req, res) => {
  try {
    const { country, city } = req.query;

    if (!country || !city) {
      return res.status(400).json({ success: false, error: "Please provide both country and city" });
    }

    // Try to get freshest data from Firestore first
    if (isFirebaseEnabled()) {
      try {
        const firestoreCity = await getCityFromFirestore(country as string, city as string);
        if (firestoreCity) {
          updateCityInMemoryCache(firestoreCity);
        }
      } catch (dbErr) {
        console.error("[Database] Error querying city for projection:", dbErr);
      }
    }

    const lookup = getCityData(country as string, city as string);

    if (!lookup.found) {
      return res.status(404).json({ success: false, error: "City not found for projection" });
    }

    const projection = calculateProjection(lookup.data);
    // Call Gemini to write narrative based on the mathematical linear projection
    const narrative = await getCityProjectionNarrative(lookup.data, projection);
    projection.narrative = narrative;

    res.json({ success: true, data: projection });
  } catch (error: any) {
    console.error("Express /api/projection Error:", error);
    res.status(500).json({ success: false, error: "Could not load projection narrative." });
  }
});

// 5. Community Reports List (GET)
app.get('/api/reports', async (req, res) => {
  try {
    const { country, city, limit, offset } = req.query;
    let list: CommunityReport[] = [];

    if (isFirebaseEnabled()) {
      try {
        list = await getReportsFromFirestore(country as string, city as string);
      } catch (dbErr) {
        console.error("[Database] Error loading reports from Firestore, falling back to file:", dbErr);
        list = readReports();
        if (country) {
          list = list.filter(r => r.country.toLowerCase() === (country as string).toLowerCase());
        }
        if (city) {
          list = list.filter(r => r.city.toLowerCase() === (city as string).toLowerCase());
        }
      }
    } else {
      list = readReports();
      if (country) {
        list = list.filter(r => r.country.toLowerCase() === (country as string).toLowerCase());
      }
      if (city) {
        list = list.filter(r => r.city.toLowerCase() === (city as string).toLowerCase());
      }
    }

    // Filter out flagged / reports needing review (we can hide them from general feed)
    list = list.filter(r => !r.needs_review);

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const limitNum = limit ? parseInt(limit as string) : 20;

    list = list.slice(offsetNum, offsetNum + limitNum);

    res.json({ success: true, data: list, count: total });
  } catch (error) {
    console.error("Express GET /api/reports Error:", error);
    res.status(500).json({ success: false, error: "Could not load community reports." });
  }
});

// 6. Submit Community Report (POST)
app.post('/api/reports', async (req, res) => {
  try {
    const {
      country,
      city,
      location_description,
      display_name,
      description,
      imageBase64,
      mimeType,
      language
    } = req.body;

    if (!country || !city) {
      return res.status(400).json({ success: false, error: "Country and City are required" });
    }

    let safety_score = 5;
    let verdict = 'PENDING ANALYSIS';
    let color_detected = 'Pending analysis';
    let contaminants: string[] = [];
    let health_risks: string[] = [];
    let needs_review = false;

    // AI Analysis if image is attached
    if (imageBase64 && mimeType) {
      try {
        const aiResult = await analyzeWaterImage(imageBase64, mimeType);
        safety_score = aiResult.score;
        verdict = aiResult.verdict;
        color_detected = aiResult.color_detected;
        contaminants = aiResult.likely_contaminants;
        health_risks = aiResult.health_risks;
        
        // Auto-flag low scores or potentially bad samples
        if (safety_score <= 2) {
          needs_review = true;
        }
      } catch (aiErr) {
        console.error("Gemini analysis on community report failed:", aiErr);
        // Fallback: save without details or with basic score
        verdict = "REPORT SUBMITTED (UNANALYZED)";
      }
    }

    const newReport: CommunityReport = {
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      country,
      city,
      location_description: location_description || null,
      display_name: display_name || 'Anonymous',
      description: description || null,
      image_url: imageBase64 ? `data:${mimeType};base64,${imageBase64}` : null,
      safety_score,
      verdict,
      color_detected,
      contaminants,
      health_risks,
      needs_review,
      language: language || 'en'
    };

    // Save locally
    const currentReports = readReports();
    currentReports.push(newReport);
    writeReports(currentReports);

    // Save to Firestore if enabled
    if (isFirebaseEnabled()) {
      try {
        await saveReportToFirestore(newReport);

        // AUTOMATIC DYNAMIC UPDATE IN DATABASE:
        // Automatically recalculate the city's safety score and update it in Firestore!
        const lookup = getCityData(country, city);
        if (lookup.found) {
          const cityData = lookup.data;
          
          // Get all non-flagged reports for this city from Firestore
          const cityReports = await getReportsFromFirestore(country, city);
          const activeReports = cityReports.filter(r => !r.needs_review);

          if (activeReports.length > 0) {
            const totalScore = activeReports.reduce((sum, r) => sum + r.safety_score, 0);
            const averageCommunityScore = totalScore / activeReports.length;

            // Blend the static score with the average community score (70% original, 30% community)
            const originalWeight = 0.7;
            const communityWeight = 0.3;
            const blendedScore = Math.max(1, Math.min(10, Math.round((cityData.safety_score * originalWeight) + (averageCommunityScore * communityWeight))));

            let blendedLabel: 'SAFE' | 'CAUTION' | 'UNSAFE' = 'SAFE';
            if (blendedScore <= 4) blendedLabel = 'UNSAFE';
            else if (blendedScore <= 7) blendedLabel = 'CAUTION';

            const updatedCityData: CityWaterData = {
              ...cityData,
              safety_score: blendedScore,
              safety_label: blendedLabel,
              last_updated: new Date().toISOString().substring(0, 7), // YYYY-MM
            };

            await saveCityToFirestore(updatedCityData);
            updateCityInMemoryCache(updatedCityData);
            console.log(`[Database] Automatically updated city safety_score for ${city} based on community report`);
          }
        }
      } catch (dbErr) {
        console.error("[Database] Error processing automatic score update:", dbErr);
      }
    }

    res.status(201).json({ success: true, data: newReport });
  } catch (error: any) {
    console.error("Express POST /api/reports Error:", error);
    res.status(500).json({ success: false, error: "Could not save report. Please try again." });
  }
});

// 7. Get Report by ID
app.get('/api/reports/:id', async (req, res) => {
  try {
    if (isFirebaseEnabled()) {
      try {
        const colReports = await getReportsFromFirestore();
        const report = colReports.find(r => r.id === req.params.id);
        if (report) {
          return res.json({ success: true, data: report });
        }
      } catch (dbErr) {
        console.error("[Database] Error getting report from Firestore:", dbErr);
      }
    }

    const reports = readReports();
    const report = reports.find(r => r.id === req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Express GET /api/reports/:id Error:", error);
    res.status(500).json({ success: false, error: "Could not read report." });
  }
});

// 8. Flag Report (PATCH)
app.patch('/api/reports/:id/flag', async (req, res) => {
  try {
    const reportId = req.params.id;

    // Local update
    const reports = readReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index].needs_review = true;
      writeReports(reports);
    }

    // Firestore update
    if (isFirebaseEnabled()) {
      try {
        const colReports = await getReportsFromFirestore();
        const report = colReports.find(r => r.id === reportId);
        if (report) {
          report.needs_review = true;
          await saveReportToFirestore(report);
        }
      } catch (dbErr) {
        console.error("[Database] Error flagging report in Firestore:", dbErr);
      }
    }

    res.json({ success: true, message: "Report flagged successfully." });
  } catch (error) {
    console.error("Express PATCH /api/reports/:id/flag Error:", error);
    res.status(500).json({ success: false, error: "Could not flag report." });
  }
});

// 9. Manual / Administrative City Quality Update Route (POST)
// Ensures any direct administrative edits/updates on water parameters automatically sync to Firestore database
app.post('/api/city/update', async (req, res) => {
  try {
    const cityData = req.body as CityWaterData;
    if (!cityData || !cityData.country || !cityData.city) {
      return res.status(400).json({ success: false, error: "Missing required city water quality parameters." });
    }

    // Save memory cache
    updateCityInMemoryCache(cityData);

    // Save to Firestore if enabled
    if (isFirebaseEnabled()) {
      await saveCityToFirestore(cityData);
      console.log(`[Database] Manual city parameters update saved to Firestore for ${cityData.city}, ${cityData.country}`);
    }

    res.json({ success: true, message: "City parameters successfully updated and synchronized with database.", data: cityData });
  } catch (error: any) {
    console.error("Express POST /api/city/update Error:", error);
    res.status(500).json({ success: false, error: "Could not update city parameters in database." });
  }
});

// 10. AI Chatbot route (POST)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: "Please provide a message" });
    }

    const chatHistory = Array.isArray(history) ? history : [];
    const reply = await answerWaterQuery(message, chatHistory);
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Express /api/chat Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate chat reply" });
  }
});

// ==================== VITE INTEGRATION ====================

async function initializeDatabase() {
  if (!isFirebaseEnabled()) {
    console.log('[Database] Firebase is not enabled. Running with local files only.');
    return;
  }

  try {
    console.log('[Database] Syncing/seeding Firestore databases...');

    // 1. Seed cities if Firestore collection is empty
    const dbCities = await getAllCitiesFromFirestore();
    if (dbCities.length === 0) {
      console.log('[Database] Firestore "cities" collection is empty. Seeding from local water-by-city.json...');
      const localCities = getRawWaterData();
      for (const city of localCities) {
        await saveCityToFirestore(city);
      }
      console.log(`[Database] Seeding complete! Seeded ${localCities.length} cities.`);
    } else {
      console.log(`[Database] Loaded ${dbCities.length} cities from Firestore. Updating memory cache...`);
      setCitiesInMemoryCache(dbCities);
    }

    // 2. Migrate existing local reports to Firestore if not already present
    const dbReports = await getReportsFromFirestore();
    const localReports = readReports();
    if (localReports.length > 0) {
      const dbReportIds = new Set(dbReports.map((r) => r.id));
      let migrationCount = 0;
      for (const report of localReports) {
        if (!dbReportIds.has(report.id)) {
          await saveReportToFirestore(report);
          migrationCount++;
        }
      }
      if (migrationCount > 0) {
        console.log(`[Database] Migrated/upserted ${migrationCount} local reports to Firestore.`);
      } else {
        console.log('[Database] All local reports are already present in Firestore.');
      }
    }
  } catch (error) {
    console.error('[Database] Sync/seeding failed:', error);
  }
}

async function startServer() {
  // Initialize and seed Firestore database
  await initializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[AquaCheck AI Server] Running on http://localhost:${PORT}`);
    });
  } else {
    console.log('[AquaCheck AI Server] Running in Vercel Serverless environment.');
  }
}

startServer();

export default app;
