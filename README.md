# ATS Resume Optimizer

AI-powered resume analyzer that:
1. **Parses your PDF** resume server-side using `pdf-parse`
2. **Scrapes LinkedIn** profile data via Apify
3. **Analyzes with Gemini** 1.5 Flash for deep ATS scoring + suggestions

---

## 🚀 Deploy to Vercel in 5 minutes

### Step 1: Clone & install
```bash
git clone <your-repo>
cd resume-ats-app
npm install
```

### Step 2: Get API keys

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Copy the key

#### Apify Token
1. Sign up at [Apify](https://apify.com) (free tier available)
2. Go to **Settings → Integrations**
3. Copy your **Personal API token**
4. The app uses the `apify/linkedin-profile-scraper` actor (billed per use — ~$0.25 per profile)

### Step 3: Set environment variables

Create a `.env.local` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
APIFY_API_TOKEN=your_apify_token_here
```

### Step 4: Deploy to Vercel

**Option A — Vercel CLI:**
```bash
npm i -g vercel
vercel --prod
# Add env vars when prompted, or set them in Vercel dashboard
```

**Option B — GitHub:**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Add env vars in **Settings → Environment Variables**:
   - `GEMINI_API_KEY`
   - `APIFY_API_TOKEN`
4. Click **Deploy**

---

## 🏃 Local development

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📋 Features

- **PDF Upload & Parse** — Drag-and-drop PDF parsing, extracts sections automatically
- **LinkedIn Sync** — Apify-powered LinkedIn profile scraper, compares against resume
- **Job Description Matching** — Paste a JD for keyword-targeted analysis
- **Gemini AI Analysis** — Comprehensive ATS scoring with:
  - Score breakdown (Keywords, Formatting, Metrics, Completeness)
  - Prioritized suggestions (Critical → Warning → Improvement → Tip)
  - Missing ATS keywords
  - LinkedIn vs Resume gaps
  - Quick wins (fixable in < 5 min)
- **Live Editor** — Edit resume sections in-browser with real-time word count
- **Preview Mode** — Formatted resume preview

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |
| `APIFY_API_TOKEN` | Apify personal API token | ✅ For LinkedIn sync |

---

## 🛠 Tech Stack

- **Next.js 14** (App Router, API Routes)
- **TypeScript**
- **Tailwind CSS**
- **pdf-parse** — server-side PDF text extraction
- **Apify** — LinkedIn profile scraping
- **Google Gemini 1.5 Flash** — AI analysis

---

## 📝 Notes

- LinkedIn scraping requires the profile to be **public** or the scraper to be authenticated
- Apify's `linkedin-profile-scraper` actor costs ~$0.25 per profile on pay-per-use
- Gemini 1.5 Flash is used (fast + cheap: ~$0.00015 per 1K input tokens)
- PDF parsing works only with text-based PDFs (not scanned images)
- All API routes use Node.js runtime for server-side processing
