# Agent Implementation Spec: Premium AI Chat Workspace

## Project Overview
Build a highly scalable, multi-tenant AI chat interface with a Master-Detail UI layout. The application includes user authentication, routes requests to various LLMs via OpenRouter, and features a toggleable, premium long-term memory system powered by PostgreSQL and `pgvector`.

## Tech Stack
* Framework: Next.js (App Router)
* UI/Styling: Tailwind CSS, Framer Motion, Shadcn UI (specifically the `Sidebar` component)
* Authentication: NextAuth.js (Auth.js) with standard Credentials provider (Email/Password)
* Backend/API: tRPC (for standard CRUD), Vercel AI SDK (for streaming)
* Database: PostgreSQL with `pgvector` extension
* ORM: Drizzle ORM

## Database Architecture (Drizzle ORM)
1. **`users` Table:** Fields for `id`, `email`, `passwordHash` (must be hashed via bcrypt), `isPremium`, `memoryEnabled`, and `createdAt`.
2. **`conversations` Table:** Fields for `id`, `userId` (foreign key), `title`, and `updatedAt`.
3. **`messages` Table:** Fields for `id`, `conversationId` (foreign key), `role` (user/assistant), and `content`. This handles the short-term state.
4. **`memory_chunks` Table:** Fields for `id`, `userId`, `content`, and `embedding` (using `pgvector` HNSW index). This handles the long-term semantic memory.

## UI & Routing Architecture (Master-Detail Layout)
1. **Auth Pages:** Create `/login` and `/register` pages with form validation.
2. **The App Shell (`/chat` layout):** Implement the Shadcn `Sidebar` component.
   * **The Master (Sidebar):** Fetch and display a list of the user's past `conversations` sorted by `updatedAt`.
   * **The Detail (Main Content):** The main area dynamically renders the chat interface.
3. **Dynamic Routing:** * Navigate to `/chat` for a blank slate (new conversation).
   * Navigate to `/chat/[conversationId]` to load the history of a specific past conversation into the main view.
4. **Chat Interface:** Include a model selector dropdown. Use Framer Motion to create smooth accordion dropdowns to display `<think>` tags parsed from reasoning models.

## AI & Streaming Logic
1. Create the OpenRouter streaming API route. 
2. **RAG Pipeline:** Before sending the payload to OpenRouter, calculate the cosine distance of the user's prompt against their specific rows in the `memory_chunks` table and inject the top semantic matches into the system prompt.
3. Ensure the streaming response saves the final generated text back into the standard `messages` table under the correct `conversationId`.

## Execution Strategy
Work step-by-step. 
1. Step 1: Initialize Next.js, Shadcn, and the Drizzle ORM Postgres connection.
2. Step 2: Build the Auth layer and the `users` database schema.
3. Step 3: Implement the Master-Detail Sidebar UI using mock data.
4. Step 4: Wire up the OpenRouter streaming and `pgvector` retrieval.
Request my review after completing Step 2 before moving on to the UI.