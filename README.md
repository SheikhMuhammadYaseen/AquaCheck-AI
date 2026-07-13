# 💧 AquaCheck — AI-Powered Water Safety Scanner & Public Health Insights Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-00d8ff.svg)](https://react.dev/)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://aistudio.google.com/)
[![Deployment: Vercel Ready](https://img.shields.io/badge/Deploy-Vercel%20Ready-black.svg)](https://vercel.com/)
[![Status: 100% Free & Open Source](https://img.shields.io/badge/Cost-100%25%20Free-emerald.svg)](#-why-aquacheck-is-100-free)

AquaCheck AI is a state-of-the-art, full-stack open-source application designed to democratize water quality analysis. Combining **AI computer vision, localized safety indices, public health predictive modeling, and crowdsourced community mapping**, AquaCheck AI provides instant visual and analytical telemetry regarding drinking water safety.

Designed for individuals, remote researchers, and community advocates, this platform operates as a robust, lightweight utility running seamlessly on both desktop and mobile devices.

---

## 🌟 The Core Problem We Are Solving

Access to clean, potable drinking water is a fundamental human right. Yet, millions worldwide remain vulnerable to contamination because:
1. **Expensive Equipment**: Standard chemical water testing kits and laboratory-grade spectrometers are costly, slow to yield results, and difficult to access in rural or underserved areas.
2. **Invisible Health Trends**: Public health risks (such as cholera, typhoid, or microplastics accumulation) are invisible to the naked eye, with little to no long-term statistical transparency at the local city level.
3. **Information Silos**: Local water contamination issues often go unreported to neighbors, leaving entire communities exposed to seasonal outbreaks or structural failures.

---

## 💡 How AquaCheck AI Solves It (The Solution)

AquaCheck AI builds a bridge between consumer-grade technology and expert-level environmental telemetry:

*   **Instant AI Optical Scanning**: Users upload a simple smartphone photo of their water. The custom-trained **Google Gemini Vision model** analyzes physical characteristics (turbidity, coloration, suspended particulate matter, alignment with standard containers) to generate immediate safety advisories.
*   **10-Year Public Health Risk Forecasts**: Using environmental metrics, AquaCheck AI projects a decade-long localized statistical index for critical waterborne hazards, providing communities with proactive, foresight-driven health insights.
*   **Crowdsourced Global Community Feed**: A dynamic map and live feed allow users to pin local water safety status reports, creating real-time alert systems for neighborhood cleanups, contamination spikes, or local municipal failures.
*   **Aide-de-Camp Intelligent Chatbot**: A contextualized water-safety AI assistant helps users interpret scores, provides boiling/filtration tips, and answers safety questions directly.

---

## 🎁 Why AquaCheck AI is 100% Free & Worth It

*   **Completely Free & Open Source**: No subscriptions, no hidden paywalls, no visual telemetry lockouts, and zero advertisement trackers.
*   **Global Accessibility**: By eliminating the need for expensive hardware, anyone with a smartphone can instantly evaluate their drinking water and share reports.
*   **Universal Offline Resilience**: Built-in, high-fidelity local indices (`data/community-reports.json` and regional maps) ensure the application is completely functional and responsive as a standalone client-side prototype even without server deployment or cloud database integration.

---

## 🛠️ Project Directory Structure

AquaCheck AI is organized under a modular, highly readable directory structure to help developers contribute easily:

```text
├── 📂 .github/                 # GitHub workflows & CI settings (Optional)
├── 📂 api/                     # Vercel serverless function entry-points
│   └── index.ts                # Serverless redirection handler to Express Router
├── 📂 assets/                  # Public static branding assets, icons, and logos
├── 📂 data/                    # Fallback database, mock streams, and regional seed indices
│   └── community-reports.json  # Pre-populated reports for instant offline boot-ups
├── 📂 src/                     # Main React Frontend Application
│   ├── 📂 components/          # Reusable UI views and features
│   │   ├── CityChecker.tsx     # City-by-city water safety search & stats
│   │   ├── CityReport.tsx      # Comprehensive local city safety dashboards
│   │   ├── CitySearch.tsx      # Multi-field geographical input handlers
│   │   ├── CommunityMap.tsx    # Interactive map showing active crowdsourced issues
│   │   ├── DiseaseBreakdown.tsx# Predictive statistics and epidemiological graphs
│   │   ├── NavTabs.tsx         # Highly responsive, animated device navigation rails
│   │   ├── RiskProjection.tsx  # Dynamic 10-year environmental forecast graphs
│   │   ├── WaterChatbot.tsx    # Responsive Gemini AI companion window
│   │   └── WaterChecker.tsx    # AI optical scanner interface & camera upload engine
│   ├── 📂 lib/                 # Core engine helpers and integration modules
│   │   ├── cityData.ts         # High-resolution geographical and statistical tables
│   │   ├── firebase.ts         # Firebase App Client and dynamic Firestore mappings
│   │   └── gemini.ts           # Gemini Vision API prompts, tokens, and response parsing
│   ├── App.tsx                 # Core Layout Coordinator (manages global routing states)
│   ├── index.css               # Global Tailwind CSS configurations & premium themes
│   └── main.tsx                # Frontend entry point mounting Virtual DOM
├── .env.example                # Blueprint for local and server environment secrets
├── firebase-applet-config.json # Local dynamic credentials for database (Optional)
├── firestore.rules             # Secure read/write security rules for Firestore integration
├── package.json                # Bundler scripts, libraries, and dev configurations
├── server.ts                   # Unified full-stack Node.js Express Server
├── tsconfig.json               # Full-strict TypeScript configurations
├── vercel.json                 # Vercel-native serverless routing and builds architecture
└── README.md                   # Complete repository guide and onboarding manifest
```

---

## 🚀 Getting Started Locally (VS Code)

To test, run, or audit this project on your personal computer using VS Code, follow these quick steps:

### 1. Clone & Initialize
Open your VS Code terminal and install all dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory of the project (or duplicate and rename `.env.example`). Populate it with your free Gemini API key:

```env
GEMINI_API_KEY="your-actual-gemini-api-key"
APP_URL="http://localhost:3000"
```
> 💡 *To retrieve your free API key, sign into the [Google AI Studio Console](https://aistudio.google.com/) with any Google account.*

### 3. Run Development Server
Start the unified full-stack Node.js environment:
```bash
npm run dev
```
This launches an Express backend serving API endpoints on port `3000` while utilizing a built-in Vite middleware proxy to bundle and render your React frontend dynamically.

Open your browser to **`http://localhost:3000`**.

---

## ⚡ Deployment to Vercel (1-Click Hosting)

AquaCheck AI is optimized to build, route, and run as a serverless full-stack application on Vercel out of the box!

### Built-In Serverless Ready Features
1. **`vercel.json`**: Pre-configured to build the frontend as static assets and route all `/api/*` endpoints directly to your Express serverless wrapper.
2. **`/api/index.ts`**: Handles serverless environment invocations, redirecting them dynamically to your backend router.
3. **Flexible Firebase Routing**: Gracefully switches to file fallback if a database config is not provided.

### How to Deploy:
1. Push this directory to your personal **GitHub** repository.
2. Log into your [Vercel Dashboard](https://vercel.com/) and click **Add New** > **Project**.
3. Select and import your AquaCheck AI repository.
4. Expand **Environment Variables** and add:
   *   `GEMINI_API_KEY`: *Your Google Gemini AI Studio API key.*
   *   `APP_URL`: *Your final Vercel deployment URL (e.g., `https://your-project.vercel.app`).*
5. Click **Deploy**. Vercel will build your static files and deploy your API routes in seconds!

---

## 🔥 Optional: Scaling with Cloud Firestore

AquaCheck AI relies on an offline JSON database by default so that it works immediately for developers. To allow global users to save real-time reports persistently, configure Firestore database environment variables:

```env
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-auth-domain"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-storage-bucket"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"
```
Once added, AquaCheck AI will automatically detect the configuration, establish an encrypted connection to your Firestore database, and seamlessly bypass local files to stream live reports globally!

---

## 📜 License & Contributions

This project is licensed under the **MIT License**. Contributions, issues, and feature requests are highly welcome to help make safe water telemetry accessible to all! Feel free to fork, enhance, and deploy this project for your own community.
