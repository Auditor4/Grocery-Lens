// ============================================================
// GroceryLens — Shared Constants
// ============================================================
// Constants are values that NEVER change. We define them once
// here so both frontend and backend use the exact same values.
// ============================================================

// --- Default Categories ---
// These are created when a new user signs up.
export const DEFAULT_CATEGORIES = [
    { name: 'Fruits & Vegetables', icon: '🥦', sortOrder: 1 },
    { name: 'Dairy & Eggs', icon: '🥛', sortOrder: 2 },
    { name: 'Grains & Staples', icon: '🌾', sortOrder: 3 },
    { name: 'Spices & Condiments', icon: '🧂', sortOrder: 4 },
    { name: 'Snacks & Beverages', icon: '☕', sortOrder: 5 },
    { name: 'Meat & Seafood', icon: '🍗', sortOrder: 6 },
    { name: 'Household & Cleaning', icon: '🧹', sortOrder: 7 },
    { name: 'Personal Care', icon: '🧴', sortOrder: 8 },
    { name: 'Baby & Kids', icon: '🍼', sortOrder: 9 },
    { name: 'Other', icon: '📦', sortOrder: 10 },
] as const;

// --- Measurement Units ---
export const UNITS = ['Kg', 'g', 'L', 'mL', 'pcs', 'dozen', 'pack'] as const;
export type Unit = typeof UNITS[number];

// --- Purchase Channels ---
// Where users can buy their groceries
export const CHANNELS = ['Zepto', 'Blinkit', 'Flipkart Minutes', 'Offline', 'Other'] as const;
export type Channel = typeof CHANNELS[number];

// --- UID Generation ---
// Characters used for UID generation. We exclude ambiguous chars:
// No 0 (looks like O), no 1 (looks like I/L), no O, no I, no L
export const UID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const UID_PREFIX = 'GL-';
export const UID_LENGTH = 6;

// --- Group Code ---
export const GROUP_PREFIX = 'GRP-';
export const GROUP_CODE_LENGTH = 6;

// --- Validation Rules ---
export const VALIDATION = {
    USER_ID_MIN: 4,
    USER_ID_MAX: 20,
    USER_ID_PATTERN: /^[a-zA-Z0-9_]+$/,
    GROUP_NAME_MAX: 50,
    ITEM_NAME_MAX: 100,
    NOTES_MAX: 500,
    MAX_AMOUNT: 99999999.99,
    MAX_QUANTITY: 9999999.999,
} as const;

// --- Session ---
export const SESSION_DURATION_DAYS = 30;

// --- Rate Limiting ---
export const RATE_LIMIT = {
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_WINDOW_MINUTES: 1,
    API_MAX_REQUESTS: 100,
    API_WINDOW_MINUTES: 1,
} as const;
