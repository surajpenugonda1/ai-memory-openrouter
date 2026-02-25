# Memory Chat

A Next.js chat application featuring persistent vector memory, specific model filtering (via OpenRouter), and streaming UI using the AI SDK v6.

## Getting Started

### 1. Start the PostgreSQL Database (Docker)
Ensure Docker is running on your machine, then start the PostgreSQL instance with the pgvector extension:
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Database Management (Drizzle ORM)

This project uses Drizzle ORM to manage the PostgreSQL schema. 
The schema definition is located at `src/db/schema.ts`.

### Push Schema Changes directly (Development)
If you make changes to `schema.ts`, you can push them directly to your local database without generating a migration file:
```bash
npx drizzle-kit push
```

### Generate Migration Files
If you want to track schema changes over time (for production):
```bash
npx drizzle-kit generate
```

### Apply Migrations
To apply the generated migrations to the database:
```bash
npx drizzle-kit migrate
```

### Open Drizzle Studio
To launch a visual web interface for inspecting your database rows and columns:
```bash
npx drizzle-kit studio
```
This will open a local web server (typically on port 4983) where you can manually view and edit your data.
