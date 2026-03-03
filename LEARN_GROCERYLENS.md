# 🛒 GroceryLens — Complete Beginner's Guide

> **Learn by Building**: This guide teaches you every concept behind the GroceryLens web app, from zero coding knowledge to a fully working full-stack application.

---

## Table of Contents

1. [What is a Web Application?](#1-what-is-a-web-application)
2. [The Technologies We Use (and Why)](#2-the-technologies-we-use)
3. [Project Structure Explained](#3-project-structure)
4. [Setting Up Your Development Environment](#4-setup)
5. [The Database — Where Data Lives](#5-database)
6. [The Backend — Your API Server](#6-backend)
7. [Authentication — How Users Log In](#7-authentication)
8. [The Frontend — What Users See](#8-frontend)
9. [How Everything Connects](#9-connections)
10. [Running the App](#10-running)
11. [Glossary](#11-glossary)

---

## 1. What is a Web Application?

When you open a website in your browser (Chrome, Firefox, etc.), two things are happening:

### The Frontend (Client)
This is what you **see** — the buttons, colors, text, forms, and charts. It runs **inside your browser**. When you click a button or type in a form, the frontend handles it.

### The Backend (Server)
This is what you **don't see** — it runs on a computer somewhere (a "server") and handles the real work: saving data to a database, checking if your password is correct, calculating your spending analytics, etc.

### How They Talk: HTTP Requests
The frontend and backend communicate using **HTTP requests** — like sending letters back and forth:

```
[Your Browser]  ---->  "Hey server, save this milk purchase"  ----> [Server]
[Your Browser]  <----  "Done! Here's the saved entry"          <---- [Server]
```

Each request has a **method** that says what kind of action you want:

| Method | Meaning | Example |
|--------|---------|---------|
| `GET` | "Give me data" | Get my list of entries |
| `POST` | "Create something new" | Save a new grocery item |
| `PUT` | "Update something" | Change the price of an item |
| `DELETE` | "Remove something" | Delete an entry |

---

## 2. The Technologies We Use

### React (Frontend Framework)
**What**: A JavaScript library for building user interfaces.
**Why**: Instead of writing raw HTML for every page, React lets you build **reusable components** (like LEGO blocks). A "StatCard" component can be reused for "Total Spend", "Items", "Avg/Entry" etc.
**Analogy**: Think of React like a **recipe book** — you define how each dish (component) looks once, then cook (render) it whenever needed.

### TypeScript
**What**: JavaScript with **type checking**.
**Why**: JavaScript lets you put a number where text should go and won't complain until your app crashes. TypeScript catches these mistakes while you're coding, before anything breaks.
**Analogy**: Like a **spell checker** but for code logic.

### Vite
**What**: A development tool that bundles your frontend code and serves it locally with hot reload.
**Why**: When you change a file, Vite instantly refreshes the browser. No manual reload needed.

### Tailwind CSS
**What**: A CSS framework where you style elements using class names directly in your HTML/JSX.
**Why**: Instead of writing separate CSS files with rules like `.my-button { background: green; padding: 10px; }`, you write `className="bg-green-500 p-2.5"` right on the element.

### Node.js + Express (Backend)
**What**: Node.js lets you run JavaScript on a server (not just in a browser). Express is a framework that makes building APIs easy.
**Why**: Using JavaScript for both frontend AND backend means you only need to learn one language.

### Prisma (ORM)
**What**: A tool that lets you talk to your database using JavaScript/TypeScript instead of writing raw SQL queries.
**Why**: Instead of `SELECT * FROM users WHERE user_id = 'mayank_42'`, you write `prisma.user.findUnique({ where: { userId: 'mayank_42' } })`. Much easier to read and debug.
**Analogy**: Like a **translator** between your code and the database.

### SQLite (Database)
**What**: A lightweight database that stores all data in a single file (`dev.db`).
**Why**: Unlike PostgreSQL or MySQL which need separate installation and setup, SQLite is just a file. Perfect for learning and development.

### JWT (JSON Web Tokens)
**What**: A secure token (a long string of characters) that proves who you are.
**Why**: After you log in, the server creates a JWT and stores it in your browser's cookies. Every subsequent request includes this token so the server knows it's you without asking for credentials again.

---

## 3. Project Structure

```
THE NEW GROCERY APP/
│
├── packages/              ← Monorepo: code split into packages
│   ├── shared/            ← Types & constants used by BOTH frontend and backend
│   │   └── src/
│   │       ├── types.ts      TypeScript interfaces (data shapes)
│   │       └── constants.ts  Default categories, units, channels
│   │
│   ├── api/               ← BACKEND: Express server
│   │   ├── prisma/
│   │   │   ├── schema.prisma  Database table definitions
│   │   │   ├── seed.ts        Script to insert default categories
│   │   │   └── dev.db         SQLite database file (auto-created)
│   │   └── src/
│   │       ├── index.ts       Server entry point (starts Express)
│   │       ├── middleware/
│   │       │   ├── auth.ts    JWT authentication checker
│   │       │   └── rateLimit.ts  Prevents brute-force attacks
│   │       ├── routes/
│   │       │   ├── auth.ts       Sign up, log in, log out
│   │       │   ├── entries.ts    Add, list, update, delete items
│   │       │   ├── analytics.ts  Dashboard data (charts, stats)
│   │       │   ├── groups.ts     Create groups, manage members
│   │       │   ├── categories.ts Category management
│   │       │   ├── autocomplete.ts  Item name suggestions
│   │       │   └── export.ts     CSV download
│   │       └── services/
│   │           └── uid.ts       Generates UID codes (GL-XXXXXX)
│   │
│   └── web/               ← FRONTEND: React app
│       ├── index.html        HTML entry point
│       ├── vite.config.ts    Vite configuration
│       ├── tailwind.config.js  Tailwind CSS configuration
│       └── src/
│           ├── main.tsx       React entry point
│           ├── App.tsx        Root component (routing)
│           ├── index.css      Global styles + Tailwind
│           ├── context/
│           │   └── AuthContext.tsx   Login state management
│           ├── lib/
│           │   └── api.ts     API client (talks to backend)
│           ├── components/
│           │   └── Layout.tsx  Sidebar + nav layout
│           └── pages/
│               ├── LandingPage.tsx   Login / Sign Up
│               ├── HomePage.tsx      Entry feed + stats
│               ├── AddItemPage.tsx   Add grocery item form
│               ├── AnalyticsPage.tsx Charts & insights
│               ├── GroupsPage.tsx    Group management
│               └── SettingsPage.tsx  Account & preferences
│
├── package.json           ← Root config: npm workspaces
├── .env                   ← Environment variables (secrets)
├── .gitignore             ← Files Git should ignore
└── tsconfig.base.json     ← Shared TypeScript config
```

### Why a Monorepo?
A **monorepo** keeps all your code in one repository but split into logical packages:
- `shared` — Code used by both frontend and backend (prevents duplication)
- `api` — Backend-only code
- `web` — Frontend-only code

**npm workspaces** lets you install all dependencies with a single `npm install` at the root.

---

## 4. Setting Up Your Development Environment

### Step 1: Install Node.js
Node.js is the **engine** that runs JavaScript outside a browser.

```powershell
# On Windows, install via winget:
winget install OpenJS.NodeJS.LTS
```

Verify it worked:
```powershell
node --version    # Should show v20+ or v24+
npm --version     # Should show 10+ or 11+
```

### Step 2: Install Dependencies
From the project root folder:
```powershell
npm install
```
This reads every `package.json` in the monorepo and installs all libraries into `node_modules/`.

### Step 3: Set Up the Database
```powershell
cd packages/api
npx prisma db push     # Creates the SQLite database + tables
npx tsx prisma/seed.ts  # Inserts default categories
```

### Step 4: Run the App
Open **two terminals**:

**Terminal 1 — Backend:**
```powershell
cd packages/api
npx tsx src/index.ts
# 🛒 GroceryLens API running on port 3001
```

**Terminal 2 — Frontend:**
```powershell
cd packages/web
npx vite
# VITE ready at http://localhost:5173
```

Open `http://localhost:5173` in your browser. 🎉

---

## 5. The Database — Where Data Lives

### What is a Database?
A database is like a **collection of spreadsheets** (called "tables"). Each table stores one type of thing:

| Table | Stores | Example Row |
|-------|--------|-------------|
| `users` | User accounts | mayank_42, joined Mar 2026 |
| `groups` | Shared groups | "Flat 302 Kitchen" |
| `group_members` | Who's in which group | mayank_42 is ADMIN of Flat 302 |
| `categories` | Item categories | 🥦 Fruits & Vegetables |
| `grocery_entries` | Each purchase | Milk, ₹68, 1L, Zepto, 3 Mar |

### The Prisma Schema
The file `prisma/schema.prisma` defines what tables exist and what columns each has. Here's a simplified example:

```prisma
model User {
  id          String   @id @default(uuid())     // Unique ID (auto-generated)
  userId      String   @unique                   // Login name (e.g. "mayank_42")
  uidHash     String                             // Hashed secret key
  displayName String                             // Shown in the UI
  createdAt   DateTime @default(now())           // When account was created
}
```

Each line is a **column**:
- `@id` — This is the primary key (unique identifier)
- `@default(uuid())` — Auto-generates a unique ID
- `@unique` — No two users can have the same value
- `@default(now())` — Automatically set to current time

### Relations
Tables are connected via **foreign keys**. A grocery entry references:
- Which **user** added it (`addedBy` → `User.id`)
- Which **category** it belongs to (`categoryId` → `Category.id`)
- Which **group** it's in, if any (`groupId` → `Group.id`)

---

## 6. The Backend — Your API Server

### What is an API?
An **API** (Application Programming Interface) is a set of URLs your frontend can call to get or send data. Each URL is called an **endpoint**.

### Endpoints Explained

| Endpoint | Method | What it Does |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create a new account |
| `/api/auth/login` | POST | Log in with User ID + UID |
| `/api/auth/me` | GET | Get current user info |
| `/api/entries` | GET | List grocery entries |
| `/api/entries` | POST | Save a new entry |
| `/api/analytics/summary` | GET | Monthly spend overview |
| `/api/analytics/by-category` | GET | Spend breakdown by category |
| `/api/groups` | POST | Create a new group |

### How a Route Works (Example: Adding an Entry)

```typescript
// In routes/entries.ts
router.post('/', async (req, res) => {
  // 1. Read data from the request body
  const { name, amount, quantity, unit, categoryId, channel, purchaseDate } = req.body;

  // 2. Save to database using Prisma
  const entry = await prisma.groceryEntry.create({
    data: {
      name: name.trim(),
      amount: parseFloat(amount),
      quantity: parseFloat(quantity),
      unit,
      categoryId,
      channel,
      purchaseDate: new Date(purchaseDate),
      scopeType: 'PERSONAL',
      addedBy: req.user.id,    // From the auth middleware
    },
  });

  // 3. Send the saved entry back as JSON
  res.status(201).json({ success: true, data: entry });
});
```

**Line by line:**
1. `router.post('/')` — This handles POST requests to `/api/entries`
2. `req.body` — The data sent by the frontend (from the form)
3. `prisma.groceryEntry.create()` — Tells Prisma to INSERT a row into the database
4. `res.status(201).json(...)` — Send back status 201 (Created) with the saved data

### Middleware: Code That Runs First
Before your route code runs, **middleware** runs first. Our app has two:

1. **Auth Middleware** (`requireAuth`): Checks if the user has a valid JWT cookie. If not, returns `401 Unauthorized`.
2. **Rate Limiter**: Counts login attempts. After 5 failures in 1 minute, blocks further attempts.

---

## 7. Authentication — How Users Log In

GroceryLens uses a **deliberately simple** identity system — no passwords, no emails.

### Signup Flow
```
User chooses "mayank_42" → Server generates "GL-7X9K2M"
                         → Hashes it with bcrypt
                         → Stores the HASH (not the original)
                         → Returns the original UID ONCE
                         → Creates a JWT token → sets cookie
```

### What is bcrypt Hashing?
**Hashing** is a one-way transformation. You can turn "GL-7X9K2M" into a hash like `$2a$10$xK3j...`, but you can **never** reverse it. During login, bcrypt **compares** the provided UID against the stored hash without ever exposing the original.

**Why?** If someone steals your database, they get useless hashes — not real UIDs.

### What is a JWT?
After login, the server creates a **JSON Web Token** — a signed string containing:
```json
{ "id": "abc-123", "userId": "mayank_42", "exp": 1714000000 }
```

This is stored in an **httpOnly cookie** (JavaScript can't read it — prevents XSS attacks). Every request includes this cookie automatically.

---

## 8. The Frontend — What Users See

### React Components
Everything in React is a **component** — a reusable piece of UI. Components can contain other components:

```
App
├── Layout (sidebar + nav)
│   ├── HomePage
│   │   ├── StatCard (×4)
│   │   └── EntryCard (×many)
│   ├── AddItemPage
│   │   └── Form fields
│   └── AnalyticsPage
│       ├── PieChart
│       ├── BarChart
│       └── LineChart
```

### State: How React Remembers Things
**State** is data that can change over time. When state changes, React automatically re-renders the component.

```tsx
const [entries, setEntries] = useState([]);    // Start with empty array
// Later...
setEntries(newData);  // React re-renders to show the new data
```

### useEffect: Running Code at the Right Time
`useEffect` runs code **after** the component renders:

```tsx
useEffect(() => {
  loadData();   // Fetch entries from the API when page loads
}, []);         // [] means "only run once"
```

### The API Client (`lib/api.ts`)
Instead of writing `fetch()` everywhere, we have a centralized API client:

```tsx
// In a page component:
const res = await api.getEntries({ limit: '20' });
if (res.success) {
  setEntries(res.data.entries);
}
```

### Routing with React Router
React Router maps URLs to components:

```tsx
<Routes>
  <Route path="/home" element={<HomePage />} />
  <Route path="/add" element={<AddItemPage />} />
  <Route path="/analytics" element={<AnalyticsPage />} />
</Routes>
```

When the user navigates to `/analytics`, React renders `<AnalyticsPage />`.

---

## 9. How Everything Connects

Here's the complete flow when a user adds a grocery item:

```
1. User fills out the form on AddItemPage
           ↓
2. User clicks "Save Entry"
           ↓
3. React calls api.createEntry({name:"Milk", amount:68, ...})
           ↓
4. api.ts sends a POST request to http://localhost:3001/api/entries
   (with the JWT cookie attached)
           ↓
5. Express receives the request
           ↓
6. Auth middleware checks the JWT → valid → attaches user to req
           ↓
7. entries.ts route handler runs
           ↓
8. Prisma inserts a row into the grocery_entries table in SQLite
           ↓
9. Server responds with the saved entry (201 Created)
           ↓
10. React receives the response → shows "Item saved!" message
           ↓
11. User navigates to Home → api.getEntries() fetches the list
           ↓
12. HomePage renders the entry with the 🥛 icon, "₹68", "Zepto"
```

---

## 10. Running the App

### Quick Start (Two Commands)
```powershell
# Terminal 1 — Backend
cd packages/api
npx tsx src/index.ts

# Terminal 2 — Frontend
cd packages/web
npx vite
```

Then open **http://localhost:5173** in your browser.

### Common Issues

| Problem | Solution |
|---------|----------|
| `npm: not found` | Install Node.js: `winget install OpenJS.NodeJS.LTS` |
| `DATABASE_URL not found` | Copy `.env.example` to `.env` in both root and `packages/api/` |
| Port 3001 already in use | Another app is using it. Kill it or change PORT in `.env` |
| Blank page | Check browser console (F12) for errors |

---

## 11. Glossary

| Term | Plain English |
|------|---------------|
| **API** | A set of URLs your app can call to get/send data |
| **Backend** | Server-side code that handles data and logic |
| **bcrypt** | A library that securely hashes passwords/keys |
| **Component** | A reusable piece of UI in React |
| **CORS** | Browser security rule — allows frontend and backend on different ports to communicate |
| **CRUD** | Create, Read, Update, Delete — the 4 basic database operations |
| **Database** | Structured storage for your app's data (like spreadsheets) |
| **Endpoint** | A specific URL on your API (e.g., `/api/entries`) |
| **Express** | A Node.js framework for building web servers |
| **Frontend** | Client-side code that runs in the browser (what users see) |
| **HTTP** | The protocol browsers use to communicate with servers |
| **httpOnly Cookie** | A cookie that JavaScript can't access (security feature) |
| **JWT** | A signed token that proves who you are after logging in |
| **Middleware** | Code that runs before your route handler (like a security guard) |
| **Monorepo** | One repository containing multiple related projects |
| **npm** | Node Package Manager — installs JavaScript libraries |
| **ORM** | Object-Relational Mapping — talk to databases with code instead of SQL |
| **Prisma** | An ORM for Node.js/TypeScript |
| **Props** | Data passed from a parent component to a child component in React |
| **Rate Limiting** | Restricting how many requests someone can make in a time period |
| **React** | A JavaScript library for building user interfaces |
| **REST** | An architecture for designing APIs using HTTP methods |
| **Route** | A URL pattern that maps to a handler function |
| **Schema** | The structure/blueprint of your database tables |
| **Seed** | Pre-loading a database with initial data |
| **SQLite** | A lightweight file-based database |
| **State** | Data in a React component that can change over time |
| **Tailwind CSS** | A utility-first CSS framework |
| **TypeScript** | JavaScript with type checking |
| **UID** | Unique Identifier — a code that identifies a user |
| **Vite** | A fast frontend build tool with hot module replacement |

---

*Built with ❤️ as a learning project. Happy coding!*
