# GroceryLens
### Smart Grocery Tracker — Web Application

**Product Requirements Document & Execution Plan**

Version 2.0 | March 2026
Author: Mayank | Status: Draft

---

| Property | Detail |
|---|---|
| Document Type | PRD + Execution Plan |
| Platform | Web Application (React + Node.js + PostgreSQL) |
| Target Users | Individuals / Households / Flatmate groups tracking grocery spend |
| Identity Model | No-login UID system. Username + system-generated UID. |
| Priority | High - Personal productivity tool |

---

# PART 1: PRODUCT REQUIREMENTS DOCUMENT

---

## 1. Executive Summary

GroceryLens is a web application designed to help individuals, households, and shared living groups track every grocery purchase - what they buy, how much they spend, where they buy from, and how their consumption patterns change over time. The app runs in any modern browser on desktop or mobile, with no app store installation required.

The identity model is deliberately lightweight: there are no passwords and no email-based login. When a user creates an account, they choose a unique username (their User ID) and the system generates a short UID (e.g. `GL-7X9K2M`). The user logs in using their User ID + UID pair. To add someone to a group, you only need their UID. This keeps the barrier to entry near zero while still enabling multi-user collaboration.

The core value proposition is threefold:

- **Spend tracking** - how much money goes to groceries each month
- **Consumption intelligence** - what items are consumed, at what rate, and in what quantities
- **Purchase channel analytics** - which platforms like Zepto, Blinkit, Flipkart Minutes, or offline stores get the most business

Groups enable households or flatmates to pool grocery data, split spend views, and track shared consumption.

---

## 2. Problem Statement

Grocery spending is one of the largest recurring household expenses, yet most people lack any structured way to track it. Current pain points include:

- No visibility into monthly grocery spend breakdown by item, category, or store
- Inability to track consumption rate - how fast items are used up
- No awareness of which purchase channel (Zepto, Blinkit, Flipkart Minutes, offline) is most used or cost-effective
- Repeat purchases are entered from scratch every time, with no memory of past items
- Shared households have no way to collaboratively track and split grocery expenses
- Existing tools require heavy sign-up flows (email, password, verification) which kills adoption for a simple tracking utility

Existing solutions like spreadsheets are tedious, generic expense trackers lack grocery-specific features, and quick-commerce apps only show their own purchase history. None of them support lightweight group collaboration.

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Enable users to log every grocery purchase in under 15 seconds via any browser
- Provide at-a-glance monthly spend dashboards with drill-down capability
- Surface consumption patterns and purchase channel preferences automatically
- Enable group-based grocery tracking with zero-friction member addition via UID
- Deliver a fast, responsive web experience that works on both mobile and desktop browsers
- Require zero passwords - identity via User ID + system-generated UID only

### 3.2 Success Metrics

| Metric | Target (90 days) | Measurement |
|---|---|---|
| Daily Active Usage | 5+ entries/week avg | Server analytics |
| Entry Speed | <15 sec per item | Time from tap to save |
| Dashboard Engagement | 3+ views/week | Page view events |
| Group Adoption | >30% users in a group | Users with group membership |
| Retention (D30) | >60% | Return visit after 30 days |
| Data Completeness | >80% fields filled | % of optional fields used |

---

## 4. Target Users & Personas

### 4.1 Primary: The Household Budget Tracker

Age 25-40, urban Indian household. Orders from Zepto, Blinkit, Flipkart Minutes regularly, and also shops offline at local kirana stores or supermarkets. Wants to know where the monthly grocery budget is going. Motivated by saving money and reducing waste.

### 4.2 Secondary: The Health-Conscious Eater

Age 22-35, fitness-oriented individual who wants to track what they eat at the grocery level. Interested in seeing consumption frequency, category breakdowns (proteins vs carbs vs snacks), and seasonal patterns.

### 4.3 Tertiary: The Shared Household / Flatmate Group

Flatmates or families where multiple people buy groceries for a shared kitchen. They create a group, add each other via UID, and all entries within the group are pooled. The group dashboard shows combined spend, who bought what, and per-member contribution breakdowns for easy splitting.

---

## 5. Identity & Account System

GroceryLens uses a deliberately lightweight identity model. There are no passwords, no email verification, and no OAuth flows. The goal is to make account creation as fast as opening a note-taking app.

### 5.1 Account Creation Flow

1. User visits the app and taps "Create Account"
2. User chooses a unique **User ID** (alphanumeric, 4-20 chars). This is their login identifier and display name. The app validates uniqueness in real-time.
3. System generates a **UID** - a short, unique, non-guessable code (e.g. `GL-7X9K2M`). Format: `GL-` prefix + 6 alphanumeric characters (uppercase + digits, excluding ambiguous chars like 0/O, 1/I/L).
4. User sees a confirmation screen showing both their User ID and UID with clear instructions: *"Save these. You need both to log in."*
5. Option to copy UID to clipboard and/or download a **recovery card** (a small image with both credentials).
6. Account is created. User lands on their personal dashboard.

### 5.2 Login Flow

1. User visits the app and taps "Log In"
2. User enters their **User ID + UID**
3. System validates the pair. If correct, session is created (JWT stored in httpOnly cookie).
4. If incorrect, generic error: *"Invalid credentials."* No hint about which field is wrong.
5. Session persists for 30 days (configurable). User stays logged in across browser sessions.

### 5.3 Identity Model Details

| Property | Specification |
|---|---|
| User ID | Chosen by user. Unique across system. 4-20 alphanumeric chars + underscores. Case-insensitive (stored lowercase). Acts as display name and login field. |
| UID | System-generated. Format: `GL-XXXXXX` (6 chars from set A-Z, 2-9 excluding ambiguous). Non-sequential. Stored as bcrypt hash on server; plaintext shown only once at creation. |
| Authentication | User ID + UID pair. No password. No email. No phone. |
| Session | JWT in httpOnly secure cookie. 30-day expiry. Refresh on activity. |
| Recovery | If user loses UID, there is no recovery path (by design - no email/phone to verify). User must create a new account. This is clearly communicated at creation. |
| Security Model | UID acts as a shared secret. 6-char alphanumeric from 32-char set = ~1 billion combinations. Rate limiting (5 attempts/min per User ID) prevents brute force. UID is hashed server-side. |
| Deletion | User can delete their account from Settings. Irreversible. Group data contributed by user remains but is de-identified. |

**Why no password?** The target audience is casual grocery trackers, often in India where quick-commerce is dominant. Traditional auth flows (email verification, password rules, forgot-password) add friction that kills adoption for a simple utility. The User ID + UID model gives enough security for non-sensitive grocery data while keeping onboarding under 30 seconds.

---

## 6. Group System

Groups allow multiple users to pool their grocery data under a shared view. A typical use case is flatmates sharing a kitchen, or a family where multiple members buy groceries independently.

### 6.1 Group Creation

1. Any user can create a group from their dashboard by tapping "Create Group"
2. User provides a group name (e.g. "Flat 302 Kitchen", "Home Groceries")
3. System generates a Group ID (e.g. `GRP-4K8N2W`)
4. Creator becomes the group **Admin** by default

### 6.2 Adding Members

1. Admin navigates to Group Settings -> "Add Member"
2. Admin enters the **UID** of the person they want to add (e.g. `GL-7X9K2M`)
3. System validates the UID exists. Shows the corresponding User ID for confirmation: *"Add mayank_42 to this group?"*
4. Admin confirms. The invited user sees a notification banner on their next visit: *"You've been added to Flat 302 Kitchen."*
5. Member can leave the group at any time from their own settings.

### 6.3 Group Roles & Permissions

| Role | Can Do | Cannot Do |
|---|---|---|
| Admin (creator) | Add/remove members, rename group, delete group, all Member permissions | N/A |
| Member | Add grocery entries to group, view group dashboard & analytics, leave group | Add/remove other members, rename or delete group |

### 6.4 Group Data Model

- Every grocery entry belongs to either **Personal** scope or a **Group** scope (not both)
- When adding an item, user picks the context: "Personal" or the name of a group they belong to
- Group dashboard aggregates all entries from all members in that group
- Each entry retains the "added by" field so the group knows who bought what
- A user can be in multiple groups (e.g. one for flatmates, one for family)
- Personal entries are never visible to group members. Only entries scoped to the group are shared.

### 6.5 Group Analytics Extensions

In addition to all standard analytics (spend by category, channel, item, trends), group dashboards add:

- **Spend by member** - who spent how much this month (bar chart + table)
- **Contribution split** - percentage share of total group spend per member
- **Member activity** - who logged the most entries, who is most active
- **Settlement suggestion** - if the group wants to split evenly, who owes whom and how much
- **Per-member category breakdown** - what each person tends to buy (e.g. one person buys all dairy, another buys snacks)

---

## 7. Feature Specifications

### 7.1 Feature: Quick Item Entry

The core input mechanism. Users add a grocery item with the following fields:

| Field | Type | Required? | Notes |
|---|---|---|---|
| Scope | Toggle | Yes | Personal or Group name. Defaults to last used. |
| Item Name | Text + autocomplete | Yes | Autocomplete from past entries (scoped). Fuzzy search. |
| Amount (Rs.) | Number | Yes | Total cost paid for this item |
| Quantity | Number | Yes | e.g. 2, 0.5, 500 |
| Unit | Dropdown | Yes | Kg, g, L, mL, pcs, dozen, pack |
| Category | Dropdown + custom | Yes | User-defined. Defaults provided. |
| Purchase Channel | Dropdown | Yes | Zepto, Blinkit, Flipkart Minutes, Offline, Other |
| Date | Date picker | Yes | Defaults to today |
| Notes | Text | No | e.g. "organic", "brand name", "bulk buy" |
| Photo (receipt) | File upload | No | Optional receipt image attachment |

**Smart Re-Entry:** When typing an item name, the app suggests previously added items with their last-used quantity, unit, channel, and category pre-filled. Autocomplete draws from the active scope (personal history or group history depending on toggle).

### 7.2 Feature: Custom Category Management

Users can create, rename, reorder, and delete categories. The app ships with sensible defaults but the user has full control. Group-level custom categories are shared across all group members.

**Default categories:**

| Category | Example Items |
|---|---|
| Fruits & Vegetables | Tomatoes, onions, bananas, spinach |
| Dairy & Eggs | Milk, curd, paneer, eggs, cheese |
| Grains & Staples | Rice, atta, dal, oats, bread |
| Spices & Condiments | Turmeric, salt, oil, sauces, pickles |
| Snacks & Beverages | Biscuits, chips, tea, coffee, juice |
| Meat & Seafood | Chicken, fish, mutton, prawns |
| Household & Cleaning | Detergent, dish soap, floor cleaner |
| Personal Care | Soap, shampoo, toothpaste |
| Baby & Kids | Diapers, baby food, formula |
| Other | Anything that does not fit above |

### 7.3 Feature: Dashboard & Spend Analytics

A dedicated analytics page showing spend and consumption statistics. The default time window is **1st of the current month to the current date**, with the ability to change to any custom range. When viewing a group, the dashboard shows combined group data with per-member drill-down.

#### 7.3.1 Monthly Overview Card
- Total spend this month (large, prominent number)
- Comparison to last month (% change, up/down indicator)
- Number of items purchased this month
- Number of unique items
- Average spend per purchase entry
- [Group mode] Spend by member breakdown

#### 7.3.2 Spend by Category
- Donut/pie chart showing category-wise spend distribution
- Tap a category to drill down into item-level breakdown
- Sorted by highest spend first

#### 7.3.3 Spend by Channel
- Bar chart showing total spend per purchase channel (Zepto, Blinkit, Flipkart Minutes, Offline, Other)
- Percentage share of each channel
- Most-used channel highlighted with a badge

#### 7.3.4 Item-Level Consumption Analytics
- List of all items purchased, sorted by total spend (descending)
- Per item: total quantity bought, total spend, average unit price, purchase frequency
- Consumption rate: estimated days between purchases for repeat items
- Price trend: whether the unit price for an item is rising or falling over time

#### 7.3.5 Trend Charts
- Weekly spend line chart for the selected month
- Month-over-month spend comparison (last 6 months bar chart)
- Category spend trend over time (stacked area chart)

### 7.4 Feature: Purchase Channel Intelligence

Dedicated section showing which purchase medium the user or group relies on most, and how channel usage correlates with spend.

- Channel usage frequency (number of purchases per channel)
- Average basket size per channel
- Channel loyalty score: which channel the user returns to most consistently
- Price comparison: for items bought on multiple channels, show which channel was cheaper

### 7.5 Feature: Stock & Pantry Awareness (v1.5)

Based on purchase history and estimated consumption rates, the app can predict when key items might run out and nudge the user to restock.

- Estimated stock level based on last purchase date and consumption rate
- Restock reminder via in-app notification banner
- Shopping list generation from low-stock items

### 7.6 Feature: Export & Backup

- Export data as CSV for any date range (personal or group)
- Export monthly PDF report with charts and summary
- Group admins can export full group data; members can export only their own entries + group aggregate

### 7.7 Feature: Multi-Item Batch Entry

For users who shop offline and want to log an entire receipt at once. A batch entry mode where users can quickly add multiple items in a table-like format before saving all at once. Optional: OCR-based receipt scanning in v2.

---

## 8. Data Model

The app uses PostgreSQL with the following core entities.

### 8.1 User Table

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID (PK) | No | Internal system ID |
| user_id | VARCHAR(20) | No | User-chosen unique login name (indexed, unique) |
| uid_hash | VARCHAR(60) | No | bcrypt hash of the system-generated UID |
| display_name | VARCHAR(20) | No | Defaults to user_id. Can be customized later. |
| created_at | TIMESTAMP | No | Account creation time |
| last_login_at | TIMESTAMP | Yes | Last successful authentication |

### 8.2 Group Table

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID (PK) | No | Internal group ID |
| group_code | VARCHAR(10) | No | Public group code (e.g. GRP-4K8N2W) |
| name | VARCHAR(50) | No | Group display name |
| created_by | UUID (FK) | No | References User.id (admin) |
| created_at | TIMESTAMP | No | Group creation time |

### 8.3 GroupMember Table

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID (PK) | No | Internal ID |
| group_id | UUID (FK) | No | References Group.id |
| user_id | UUID (FK) | No | References User.id |
| role | ENUM | No | ADMIN or MEMBER |
| joined_at | TIMESTAMP | No | When user was added to group |

### 8.4 Category Table

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID (PK) | No | Internal ID |
| name | VARCHAR(50) | No | Category display name |
| icon | VARCHAR(10) | Yes | Emoji or icon reference |
| sort_order | INT | No | User-defined display order |
| is_default | BOOLEAN | No | Whether system-provided or user-created |
| owner_type | ENUM | No | SYSTEM, USER, or GROUP |
| owner_id | UUID | Yes | User.id or Group.id (null for SYSTEM) |
| created_at | TIMESTAMP | No | Record creation time |

### 8.5 GroceryEntry Table

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID (PK) | No | Internal ID |
| name | VARCHAR(100) | No | Item name (indexed for search) |
| amount | DECIMAL(10,2) | No | Cost in Rs. |
| quantity | DECIMAL(10,3) | No | Numeric quantity purchased |
| unit | VARCHAR(10) | No | Kg, g, L, mL, pcs, dozen, pack |
| category_id | UUID (FK) | No | References Category.id |
| channel | VARCHAR(20) | No | Zepto, Blinkit, Flipkart Minutes, Offline, Other |
| purchase_date | DATE | No | Date of purchase |
| notes | TEXT | Yes | User notes |
| receipt_url | VARCHAR(255) | Yes | URL to uploaded receipt image |
| scope_type | ENUM | No | PERSONAL or GROUP |
| group_id | UUID (FK) | Yes | References Group.id (null if PERSONAL) |
| added_by | UUID (FK) | No | References User.id (who logged this entry) |
| created_at | TIMESTAMP | No | Record creation time |
| updated_at | TIMESTAMP | No | Last modification time |

---

## 9. Screen Architecture & Navigation

The webapp uses a responsive layout with a **sidebar on desktop** and a **bottom navigation bar on mobile**. Five primary views:

| Home | Add Item | Analytics | Groups | Settings |
|---|---|---|---|---|
| Recent entries feed, quick stats, search, scope toggle | Item entry form, batch mode, autocomplete, scope picker | Full dashboard: charts, filters by date/category/channel/member | Group list, create group, member management | Account info, categories, export, theme, delete account |

Navigation is flat - every primary feature is reachable in one tap. Drill-down views (item detail, category detail, channel detail, member detail) use standard browser history for back navigation. The scope toggle (Personal vs Group) persists across pages so the user does not need to re-select it.

---

## 10. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Performance | First Contentful Paint <1.5s. API response <200ms p95. Dashboard render <500ms. |
| Responsiveness | Fully responsive. Optimized layouts for mobile (360px+), tablet, and desktop. |
| Browser Support | Chrome 90+, Safari 15+, Firefox 90+, Edge 90+. Progressive enhancement. |
| Offline | Service worker caches app shell. Offline entry queue syncs on reconnect (PWA). |
| Storage | PostgreSQL for structured data. S3-compatible bucket for receipt images. |
| Privacy | No data shared with third parties. UID hashed with bcrypt. HTTPS only. |
| Accessibility | WCAG 2.1 AA. Keyboard navigation, screen reader support, high-contrast mode. |
| Localization | English (default). Hindi and Tamil as stretch goals for v1.5. |
| Theme | Light and dark mode. System preference detection. |
| Rate Limiting | 5 login attempts/min per User ID. 100 API requests/min per session. |

---

# PART 2: EXECUTION & IMPLEMENTATION PLAN

---

## 11. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript | Component model, huge ecosystem, strong typing. |
| UI Library | Tailwind CSS + shadcn/ui | Utility-first CSS. Pre-built accessible components. |
| State Mgmt | Zustand or React Query | Lightweight. React Query for server state caching. |
| Charts | Recharts or Chart.js | React-native charting with good customization. |
| Backend | Node.js + Express (or Fastify) | JavaScript end-to-end. Fast, lightweight. |
| ORM | Prisma | Type-safe database access. Auto-generated types. |
| Database | PostgreSQL | Relational, ACID, excellent for analytics queries. |
| Auth | Custom (JWT in httpOnly cookie) | No password. User ID + UID pair validated against bcrypt hash. |
| File Storage | S3-compatible (AWS S3 / Cloudflare R2) | Receipt image uploads. Pre-signed URLs. |
| Hosting | Vercel (frontend) + Railway/Render (backend + DB) | Easy deploy. Free tiers available for personal projects. |
| CI/CD | GitHub Actions | Automated build, test, lint, deploy pipeline. |
| PWA | Workbox | Service worker for offline entry queue and app shell caching. |

---

## 12. Project Architecture

Monorepo structure with separate frontend and backend packages.

### 12.1 Directory Structure

- **`/packages/web`** - React frontend. Pages, components, hooks, stores, API client.
- **`/packages/api`** - Node.js backend. Routes, controllers, services, Prisma schema, middleware.
- **`/packages/shared`** - Shared TypeScript types, validation schemas (Zod), constants.

### 12.2 Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing + login/signup. No auth required. |
| `/home` | Recent entries feed with scope toggle and quick stats. |
| `/add` | Item entry form with scope picker, autocomplete, batch mode. |
| `/analytics` | Full dashboard. Charts, filters, drill-downs. |
| `/groups` | Group list, create, manage members. |
| `/groups/:id` | Group detail with member list and group-scoped analytics. |
| `/settings` | Account, categories, export, theme, delete account. |

### 12.3 API Endpoints (Key)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (user_id -> UID returned once) |
| POST | `/api/auth/login` | Validate user_id + UID -> JWT session |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/entries` | List entries (filterable by scope, date, category, channel) |
| POST | `/api/entries` | Create entry (single or batch) |
| PUT | `/api/entries/:id` | Update entry |
| DELETE | `/api/entries/:id` | Delete entry (soft delete) |
| GET | `/api/analytics/summary` | Monthly overview (total, count, avg, MoM change) |
| GET | `/api/analytics/by-category` | Spend grouped by category |
| GET | `/api/analytics/by-channel` | Spend grouped by channel |
| GET | `/api/analytics/by-item` | Item-level consumption stats |
| GET | `/api/analytics/trends` | Time-series spend data |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/:id/members` | Add member by UID |
| DELETE | `/api/groups/:id/members/:uid` | Remove member |
| GET | `/api/groups/:id/analytics` | Group-scoped analytics with per-member breakdown |
| GET | `/api/categories` | List categories (system + user + group) |
| POST | `/api/categories` | Create custom category |
| GET | `/api/autocomplete` | Search past item names for autocomplete |

---

## 13. Sprint Plan (10-Week Build)

Assuming a solo developer or two-person team working in 1-week sprints:

| Sprint | Focus Area | Deliverables |
|---|---|---|
| **Week 1** | Foundation | Monorepo setup (Turborepo), Prisma schema + migrations, PostgreSQL provisioning, React project with Tailwind + shadcn/ui, basic routing, light/dark theme. |
| **Week 2** | Identity System | Account creation flow (User ID + UID generation), login/logout, JWT middleware, session persistence, rate limiting, recovery card download. |
| **Week 3** | Item Entry | Add Item form (all fields), scope toggle, autocomplete API, unit/channel/category pickers, form validation with Zod, save to DB. |
| **Week 4** | Home Feed | Recent entries list with search + filter, scope toggle, quick stats card, swipe-to-delete (mobile), responsive layout. |
| **Week 5** | Analytics P1 | Monthly overview card, category donut chart, channel bar chart, date range picker, basic drill-down pages. |
| **Week 6** | Analytics P2 | Item-level consumption table, price trend sparklines, consumption rate calc, weekly spend line chart, MoM comparison bar chart. |
| **Week 7** | Group System | Group CRUD, add member by UID, role management, group scope toggle, group entries feed, group-scoped analytics with per-member breakdown. |
| **Week 8** | Settings & Export | Category CRUD, CSV export, account info page (show User ID, masked UID), delete account flow, notification preferences. |
| **Week 9** | Polish & PWA | Batch entry mode, smart re-entry, PWA setup with Workbox, offline entry queue, empty states, loading skeletons, mobile optimization. |
| **Week 10** | Testing & Deploy | Unit tests (Vitest), integration tests, E2E (Playwright), performance audit (Lighthouse), deploy to Vercel + Railway, domain setup. |

---

## 14. Testing Strategy

| Layer | Tool | Coverage Target | Focus |
|---|---|---|---|
| Unit Tests | Vitest + React Testing Lib | 80%+ line coverage | Services, utils, hooks, components |
| API Tests | Supertest + Vitest | All endpoints | Auth flow, CRUD, analytics queries, group permissions |
| E2E Tests | Playwright | Critical paths | Signup -> entry -> dashboard, group creation -> add member |
| Visual | Chromatic (optional) | Key pages | Responsive layouts, chart rendering, dark mode |
| Performance | Lighthouse CI | >90 score | FCP, LCP, CLS, bundle size |
| Security | Manual + OWASP checklist | Auth flow | Rate limiting, UID brute force, session hijack, XSS |

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| User loses UID and cannot log in | High - account loss | Clear warning at creation. Downloadable recovery card. Future: optional email recovery link. |
| UID brute force attack | High - security | bcrypt hashing, 5 attempts/min rate limit, 6-char from 32-char set = ~1B combinations. |
| User drops off due to entry friction | High - engagement | Smart autocomplete, batch entry, pre-filled fields from history. |
| Group data conflicts (simultaneous edits) | Medium - UX | Optimistic UI with server-side last-write-wins. Conflict is low probability for grocery entries. |
| Scope creep (OCR, ML features) | Medium - timeline | Hard v1 scope boundary. OCR and stock prediction are v2 features only. |
| Hosting costs scale with users | Low - cost | Start on free tiers. PostgreSQL is efficient for this data shape. Upgrade path is clear. |

---

## 16. Future Roadmap (Post v1.0)

| Version | Feature | Description |
|---|---|---|
| v1.5 | Receipt OCR | Upload receipt photo -> auto-extract items, quantities, prices via ML |
| v1.5 | Optional Email Recovery | Users can optionally link an email for UID recovery |
| v1.5 | Hindi & Tamil | Localization for two major Indian languages |
| v2.0 | Stock Prediction | ML-based consumption forecasting to predict when items run out |
| v2.0 | Shopping List | Auto-generated shopping lists from predicted low-stock items |
| v2.0 | Group Budget | Set monthly budget per group with real-time progress and alerts |
| v2.5 | Price Alerts | Notify when frequently purchased items drop in price on any channel |
| v2.5 | Expense Splitting | Integration with Splitwise-like settlement for group expenses |
| v3.0 | Nutrition Overlay | Map grocery items to nutritional data for macro-level diet tracking |
| v3.0 | Mobile Apps | React Native or PWA-enhanced native wrappers for iOS and Android |

---

## 17. Appendix: Key Use Case Flows

### 17.1 Flow: New User Onboarding

1. User visits grocerylens.app and taps "Create Account"
2. Types desired User ID (e.g. "mayank_42"). Real-time validation shows availability.
3. Taps "Create". System generates UID (e.g. `GL-7X9K2M`).
4. Confirmation screen: *"Your account is ready! Save these credentials:"* showing User ID + UID with copy and download buttons.
5. User taps "Download Recovery Card" -> gets a small PNG with both credentials.
6. Taps "Continue" -> lands on empty Home page with a prompt to add their first grocery item.

### 17.2 Flow: Create Group & Add Flatmate

1. User navigates to Groups page and taps "Create Group"
2. Enters group name: "Flat 302 Kitchen". Taps Create.
3. Group created. User is auto-assigned Admin role.
4. Taps "Add Member". Enters flatmate's UID: `GL-9P3R7T`.
5. System shows: *"Add rahul_dev to Flat 302 Kitchen?"* User confirms.
6. Flatmate sees notification on next visit: *"You've been added to Flat 302 Kitchen."*
7. Both users can now toggle scope to "Flat 302 Kitchen" when adding entries or viewing analytics.

### 17.3 Flow: Add Item to Group

1. User navigates to Add Item page
2. Scope toggle shows: Personal | Flat 302 Kitchen. User selects the group.
3. Types "Milk" -> autocomplete shows past group entries for milk with last quantity and channel pre-filled.
4. User adjusts amount (Rs. 68), quantity (1L), channel (Zepto), confirms date is today.
5. Taps Save. Entry saved to group scope with "added_by" = current user.
6. Entry appears in group feed for all members. Group analytics update.

---

*End of Document - GroceryLens PRD v2.0*
