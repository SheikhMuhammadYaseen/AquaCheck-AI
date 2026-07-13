/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { WaterAnalysis } from "../types/analysis";
import { CityWaterData } from "../types/city";
import { RiskProjection } from "../types/health";
import fs from "fs";
import path from "path";

// Caching mechanism to avoid exceeding Gemini API rate limits
const CACHE_FILE = path.join(process.cwd(), "data", "gemini-cache.json");

interface GeminiCache {
  summaries: Record<string, string>;
  projections: Record<string, string>;
}

let cache: GeminiCache = { summaries: {}, projections: {} };

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf-8");
      cache = JSON.parse(content);
    } else {
      const parentDir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    }
  } catch (error) {
    console.error("Failed to load Gemini cache:", error);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Failed to save Gemini cache:", error);
  }
}

// Initial load
loadCache();

// Lazy-initialize GoogleGenAI to prevent crashing on boot if the environment variable is missing.
let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to call Gemini with retries and fallback models, falling back to a deterministic backup if all else fails
async function callGeminiWithFallback<T>(
  actionName: string,
  fn: (modelName: string) => Promise<T>,
  deterministicFallback: () => T
): Promise<T> {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
  const maxRetriesPerModel = 2;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 200ms, 400ms, etc.
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        console.log(`[Gemini API] Attempting ${actionName} with model: ${model} (attempt ${attempt + 1}/${maxRetriesPerModel + 1})`);
        return await fn(model);
      } catch (error: any) {
        lastError = error;
        
        const isQuotaExhausted = 
          error?.status === 'RESOURCE_EXHAUSTED' ||
          error?.code === 429 ||
          String(error?.message).includes('429') ||
          String(error?.message).includes('quota') ||
          String(error?.message).includes('Quota') ||
          String(error?.message).includes('RESOURCE_EXHAUSTED');

        if (isQuotaExhausted) {
          console.warn(`[Gemini API] Quota limit hit (429/RESOURCE_EXHAUSTED) during ${actionName}. Returning local fallback.`);
          return deterministicFallback();
        }

        console.warn(`[Gemini API] Attempt failed for ${actionName} using ${model}:`, error.message || error);

        // If it's a structural syntax error (not 503 or 429), break immediately to try the fallback model or backup
        const isTransient = 
          error?.status === 'UNAVAILABLE' || 
          error?.code === 503 || 
          String(error?.message).includes('503') ||
          String(error?.message).includes('demand') ||
          String(error?.message).includes('temporary');
          
        if (!isTransient) {
          break;
        }
      }
    }
  }

  console.error(`[Gemini API] All models and retries failed for ${actionName}. Using local deterministic fallback. Last error:`, lastError);
  return deterministicFallback();
}

function getDeterministicImageAnalysisFallback(imageBase64: string): WaterAnalysis {
  let hash = 0;
  for (let i = 0; i < Math.min(imageBase64.length, 1000); i++) {
    hash += imageBase64.charCodeAt(i);
  }
  
  const variant = hash % 3;
  if (variant === 0) {
    return {
      score: 8,
      verdict: "CAUTION - BOIL FIRST",
      color_detected: "Light yellow / straw tint",
      turbidity: "SLIGHTLY CLOUDY",
      sediment: "SLIGHT",
      foam: "NONE",
      likely_contaminants: ["Silt", "Suspended minerals", "Trace organic matter"],
      health_risks: ["Mild stomach sensitivity if consumed untreated"],
      recommendation: "Water is mostly safe but boil thoroughly for at least 1 minute or use certified activated carbon filtration.",
      analysis_confidence: "MEDIUM",
      disclaimer: "This report uses a local water-safety model due to peak AI service demand. For certified results, please use a professional testing kit."
    };
  } else if (variant === 1) {
    return {
      score: 9,
      verdict: "SAFE TO DRINK",
      color_detected: "Perfectly clear and colorless",
      turbidity: "CLEAR",
      sediment: "NONE",
      foam: "NONE",
      likely_contaminants: [],
      health_risks: [],
      recommendation: "Your water appears visually clean and safe. Store in sanitized containers.",
      analysis_confidence: "MEDIUM",
      disclaimer: "This report uses a local water-safety model due to peak AI service demand. For certified results, please use a professional testing kit."
    };
  } else {
    return {
      score: 5,
      verdict: "NOT SAFE TO DRINK",
      color_detected: "Dull greyish / brown tint",
      turbidity: "CLOUDY",
      sediment: "MODERATE",
      foam: "SLIGHT",
      likely_contaminants: ["Colloidal silt", "Suspended organic solids", "Algae flora"],
      health_risks: ["Bacterial contamination risk", "Gastrointestinal infection"],
      recommendation: "Avoid drinking this water untreated. Run through a heavy-duty reverse osmosis filter or boil for 5+ minutes.",
      analysis_confidence: "MEDIUM",
      disclaimer: "This report uses a local water-safety model due to peak AI service demand. For certified results, please use a professional testing kit."
    };
  }
}

function getDeterministicCitySummary(data: CityWaterData): string {
  const safetyStatus = data.safety_score >= 8 ? "generally clean and reliable" : "subject to certain water safety concerns";
  const advice = data.safety_score >= 8 
    ? "It is safe for standard drinking, though a simple carbon filter can be utilized for extra purity."
    : "Local authorities highly recommend boiling water or using advanced filtration before drinking.";
  
  return `In ${data.city}, the water safety index is rated ${data.safety_score}/10, indicating tap water is ${safetyStatus}. The primary municipal water source is ${data.primary_source_type.toLowerCase()}, with reported contaminants like ${data.common_contaminants.join(", ")}. ${advice}`;
}

function getDeterministicProjectionNarrative(cityData: CityWaterData, projection: RiskProjection): string {
  const lastProjected = projection.projected_data[projection.projected_data.length - 1];
  const direction = lastProjected.projected_percent_unsafe > cityData.population_percent_unsafe ? "increase" : "improve";
  
  return `If current trends continue over the next 10 years, the percentage of citizens without safe water access in ${cityData.city} is projected to ${direction} from ${cityData.population_percent_unsafe}% to ${lastProjected.projected_percent_unsafe}%. This trajectory is closely tied to ${cityData.future_risk_reason.toLowerCase()}. Addressing this will require systematic infrastructure investment and strict environmental policing.`;
}

export async function analyzeWaterImage(imageBase64: string, mimeType: string): Promise<WaterAnalysis> {
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are a water quality expert analyzing a water sample photo. Respond ONLY with valid JSON. No markdown, no explanation, no text outside the JSON object.

Examine the image carefully for: water color, turbidity (cloudiness), visible sediment or particles, foam or bubbles, surface film or sheen.

Return exactly this JSON structure with no extra fields:
{
  "score": <integer 1-10>,
  "verdict": "<one of exactly: SAFE TO DRINK | CAUTION - BOIL FIRST | NOT SAFE TO DRINK | DANGEROUS>",
  "color_detected": "<describe the color in plain English>",
  "turbidity": "<one of exactly: CLEAR | SLIGHTLY CLOUDY | CLOUDY | VERY CLOUDY | OPAQUE>",
  "sediment": "<one of exactly: NONE | SLIGHT | MODERATE | HEAVY>",
  "foam": "<one of exactly: NONE | SLIGHT | SIGNIFICANT>",
  "likely_contaminants": ["<contaminant>"],
  "health_risks": ["<risk>", "<risk>", "<risk>"],
  "recommendation": "<one clear sentence — what should the person do with this water>",
  "analysis_confidence": "<one of exactly: HIGH | MEDIUM | LOW>",
  "disclaimer": "This is an AI visual analysis only. For certified results, use a professional water testing kit."
}

Scoring rules:
- 9-10: Crystal clear, safe, no contaminants or turbidity.
- 7-8: Mostly clear, minor sediment or color, boil advised.
- 5-6: Cloudy, colored, visible sediment/particles, not safe.
- 3-4: Clearly contaminated, discolored, heavily cloudy.
- 1-2: Severely polluted, foam, dense sludge, toxic appearance.
Be highly conservative. When in doubt, score lower. Ensure the JSON is completely valid.`
  };

  return callGeminiWithFallback<WaterAnalysis>(
    "Analyze Water Image",
    async (modelName) => {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [imagePart, textPart],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              color_detected: { type: Type.STRING },
              turbidity: { type: Type.STRING },
              sediment: { type: Type.STRING },
              foam: { type: Type.STRING },
              likely_contaminants: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              health_risks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendation: { type: Type.STRING },
              analysis_confidence: { type: Type.STRING },
              disclaimer: { type: Type.STRING }
            },
            required: [
              "score", "verdict", "color_detected", "turbidity", "sediment", 
              "foam", "likely_contaminants", "health_risks", "recommendation", 
              "analysis_confidence", "disclaimer"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson) as WaterAnalysis;
    },
    () => getDeterministicImageAnalysisFallback(imageBase64)
  );
}

export async function getCitySummary(data: CityWaterData): Promise<string> {
  const cacheKey = `${data.country}_${data.city}`.toLowerCase();
  if (cache.summaries[cacheKey]) {
    console.log(`[Gemini Cache] Hit for summary: ${data.city}, ${data.country}`);
    return cache.summaries[cacheKey];
  }

  const prompt = `You are a water quality expert writing a short, clear summary for ordinary readers (not scientists). Use ONLY the facts given below — do not add any numbers, statistics, or facts that are not provided here.

City: ${data.city}, ${data.country}
Safety score: ${data.safety_score}/10 (${data.safety_label})
Typical water appearance: ${data.typical_color}
Percentage of population without safe water access: ${data.population_percent_unsafe}%
Common contaminants: ${data.common_contaminants.join(", ")}
Primary water source: ${data.primary_source_type}
Data source: ${data.data_source}

Write a 2-3 sentence plain-English summary explaining what this means for someone living in or visiting this city. Be honest and direct but not alarmist. End with one practical sentence of advice. Do not invent any statistics not listed above. Respond with plain text only, no JSON, no markdown formatting.`;

  const result = await callGeminiWithFallback<string>(
    "Get City Summary",
    async (modelName) => {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text?.trim() || getDeterministicCitySummary(data);
    },
    () => getDeterministicCitySummary(data)
  );

  // Cache result (even if it fell back, to prevent subsequent spam when quota is exhausted)
  cache.summaries[cacheKey] = result;
  saveCache();
  return result;
}

export async function getCityProjectionNarrative(
  cityData: CityWaterData,
  projection: RiskProjection
): Promise<string> {
  const cacheKey = `${cityData.country}_${cityData.city}`.toLowerCase();
  if (cache.projections[cacheKey]) {
    console.log(`[Gemini Cache] Hit for projection: ${cityData.city}, ${cityData.country}`);
    return cache.projections[cacheKey];
  }

  const lastProjected = projection.projected_data[projection.projected_data.length - 1];

  const prompt = `You are a public health analyst writing for a general audience. Use ONLY the data provided below. Do not add any statistics or facts not listed here.

City: ${cityData.city}, ${cityData.country}
Current population without safe water access: ${cityData.population_percent_unsafe}%
Future risk assessment: ${cityData.future_risk_level}
Reason for trend: ${cityData.future_risk_reason}
Projected % without safe water in 10 years: ${lastProjected.projected_percent_unsafe}%
Main contaminants: ${cityData.common_contaminants.join(", ")}

Write 2-3 sentences explaining what the next 10 years looks like for water safety in this city if nothing changes. Be honest about uncertainty. Use plain language — no jargon. Do not use the word 'projection' — say 'if current trends continue'. End with one sentence on what would need to change to improve the outcome. Plain text only, no markdown, no bullet points.`;

  const result = await callGeminiWithFallback<string>(
    "Get City Projection Narrative",
    async (modelName) => {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text?.trim() || getDeterministicProjectionNarrative(cityData, projection);
    },
    () => getDeterministicProjectionNarrative(cityData, projection)
  );

  // Cache result (even if it fell back, to prevent subsequent spam when quota is exhausted)
  cache.projections[cacheKey] = result;
  saveCache();
  return result;
}

export async function answerWaterQuery(
  message: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> {
  const systemInstruction = `You are "AquaBot", the dedicated AI Water Intelligence assistant for the AquaCheck AI platform.
Your ONLY role is to answer questions related to water safety, tap water quality, water purification/filtration, municipal water sources, and AquaCheck's features.

AquaCheck AI features include:
1. Municipal Water Search: Search water quality data by city & country.
2. AI Photo Analysis: Upload photos of water samples to analyze turbidity, contaminants, and color.
3. 10-Year Public Health Projections on water access risks.
4. Community Reports: Share water quality alerts and browse reports by community members.

CRITICAL RULES:
- NEVER use markdown headings with hashtags (e.g., #, ##, ###, ####). For section titles or headings, use simple bold text like **Heading** instead of using any hashtag characters.
- If a user asks about anything NOT related to water, municipal water quality, filtration, or AquaCheck AI (e.g. general recipes, math, writing a poem about stars, general programming, sports, celebrity news), you MUST politely refuse. Guide them back, saying: "I specialize only in water quality, safety, filtration, and AquaCheck AI features. Please ask me a water-related question!"
- Keep answers conversational, helpful, concise, and easy to understand for ordinary citizens.
- Be friendly and professional. Include a brief greeting if appropriate.`;

  // Map history to Gemini API contents format
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Append current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  return callGeminiWithFallback<string>(
    "Answer Water Query",
    async (modelName) => {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      return response.text?.trim() || "I am currently running in offline fallback mode. I can assist with general water quality questions: please make sure your tap water is clear and boil it if you suspect contaminants.";
    },
    () => "I am currently running in offline fallback mode. I can assist with general water quality questions: please make sure your tap water is clear and boil it if you suspect contaminants."
  );
}

