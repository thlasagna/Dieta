# Dieta — Diet & Nutrition Tracker

Mobile-first health & diet tracking web app built with Next.js 14, Tailwind CSS, and Google Gemini.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API key**
   - Copy `.env.local.example` to `.env.local`
   - Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
   - Add it to `.env.local`: `GEMINI_API_KEY=your-key`

3. **Run development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). For mobile testing, use Chrome DevTools device emulation (390px width) or your phone on the same network.

## Features

- **Log** — Log meals via photo or text. Gemini analyzes nutrition (calories, macros, vitamins, health score).
- **Suggest** — Enter symptoms, get AI food suggestions. Track weekly frequency (leafy greens, fatty fish, legumes, red meat).
- **Progress** — Weekly streak, daily calorie chart, nutrient gap, top foods.
- **Achievements** — XP, levels, 10 unlockable achievements.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Google Gemini API (gemini-2.5-flash, free tier)
- localStorage (no database, no auth)

## Deploy (Vercel)

1. Push to GitHub and import to Vercel
2. Add `GEMINI_API_KEY` in Vercel project settings
