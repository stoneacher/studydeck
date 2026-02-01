
# StudyDeck 📚

StudyDeck is an open-source flashcard app inspired by Anki.
It focuses on spaced repetition, clean organization, and fast studying — with a bit of AI help if you want it.

## What it does

* Organize cards using decks and sub-decks
* Uses spaced repetition (SM-2) so you review things when you’re about to forget them
* Supports basic Q&A cards and cloze (fill-in-the-blank) cards
* Tracks your progress and study stats
* Import and export cards with CSV
* Generate cards from text using AI
* Keyboard shortcuts for fast reviews
* Secure login with JWT auth

## Tech stack

### Backend

* Node.js + Express
* TypeScript
* PostgreSQL
* Prisma
* JWT auth
* bcrypt for passwords

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide icons

## Getting started

### Docker (recommended)

If you have Docker, this is the easiest way to run everything:

```bash
git clone https://github.com/stoneacher/studydeck.git
cd studydeck
docker compose up -d
```

Then open:
👉 [http://localhost](http://localhost)

This runs:

* PostgreSQL
* Backend API (port 3001)
* Frontend (port 80)

### Manual setup

#### Requirements

* Node.js 18+
* PostgreSQL 14+

#### Backend

```bash
cd backend
npm install

cp .env.example .env

npx prisma migrate dev
npm run dev
```

#### Frontend

```bash
cd frontend
npm install

cp .env.example .env
npm run dev
```

## Cards

### Basic cards

Simple front / back format:

* Front: What is the capital of France?
* Back: Paris

### Cloze cards

Fill-in-the-blank style:

```
The {{c1::mitochondria}} is the powerhouse of the cell.
```

With hints:

```
{{c1::Paris::capital of France}}
```

Multiple blanks:

```
{{c1::JavaScript}} was created by {{c2::Brendan Eich}} in {{c3::1995}}.
```

## Keyboard shortcuts

During reviews:

| Key   | Action      |
| ----- | ----------- |
| Space | Show answer |
| F     | Flip card   |
| 1     | Again       |
| 2     | Hard        |
| 3     | Good        |
| 4     | Easy        |

## CSV import

Example:

```csv
front,back,type,notes,tags
"What is React?","A JavaScript library for building UIs",BASIC,,javascript;react
"The {{c1::DOM}} represents the page structure",,CLOZE,,html;web
```

* `front` is required
* `back` is required for BASIC cards
* `type` defaults to BASIC
* `tags` are separated with `;`

## Spaced repetition

StudyDeck uses the SM-2 algorithm (same idea as Anki):

* You rate how well you remembered a card
* Cards you struggle with show up more often
* Cards you know well get pushed further into the future
* If you rate a card badly, it resets and comes back soon

## API (overview)

### Auth

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Decks

```
GET    /api/decks
POST   /api/decks
GET    /api/decks/:id
PUT    /api/decks/:id
DELETE /api/decks/:id
GET    /api/decks/:id/cards
GET    /api/decks/:id/due
POST   /api/decks/:id/import
GET    /api/decks/:id/export
```

### Cards

```
POST   /api/cards
PUT    /api/cards/:id
DELETE /api/cards/:id
POST   /api/cards/:id/review
POST   /api/cards/generate
POST   /api/cards/suggest-cloze
```

## Project structure

```
studydeck/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

(Each side is split into routes/components/services like you’d expect.)

## Contributing

PRs are welcome.

1. Fork the repo
2. Create a branch
3. Make your changes
4. Open a pull request

## License

MIT. Do whatever you want with it.

## Thanks

* Inspired by Anki
* SM-2 algorithm from SuperMemo
* Icons from Lucide
