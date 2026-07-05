# Excel Calendar → Apple Calendar Importer

A beautiful, minimal app that converts Excel timetables into `.ics` files that import directly into Apple Calendar.

## Project Structure

- `backend/` — Node.js/Express API that parses Excel files and generates `.ics` calendars
- `frontend/` — Expo/React Native app for upload, preview, and export

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI API key (for AI parsing fallback)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run web
```

For iOS:

```bash
npm run ios
```

For Android:

```bash
npm run android
```

## Features

- Upload `.xlsx` / `.xls` files
- Rule-based spreadsheet parsing with AI fallback
- Editable event preview
- Confidence warnings
- `.ics` export for Apple Calendar
- Dark mode support

## API Endpoints

- `POST /api/upload` — Upload spreadsheet
- `GET /api/events/:sessionId` — Retrieve parsed events
- `PUT /api/events/:sessionId` — Update events
- `POST /api/export/:sessionId` — Generate `.ics` file

## Notes

- Uploaded files are processed in memory and never stored permanently.
- If no OpenAI key is set, the app falls back to rule-based parsing only.
- Replace the empty placeholder files in `frontend/assets/` with real app icons.
