// ============================================================
// GroceryLens — Shared TypeScript Types
// ============================================================
// These types define the SHAPE of our data. Think of them as
// blueprints that tell TypeScript what properties an object
// should have. Both the frontend and backend use these same
// types so they always agree on the data format.
// ============================================================

// --- User ---
export interface User {
    id: string;
    userId: string;       // The login name the user chose (e.g. "mayank_42")
    displayName: string;  // Shown in the UI (defaults to userId)
    createdAt: string;
    lastLoginAt?: string;
}

// --- Group ---
export interface Group {
    id: string;
    groupCode: string;    // e.g. "GRP-4K8N2W"
    name: string;         // e.g. "Flat 302 Kitchen"
    createdBy: string;    // User ID of the admin
    createdAt: string;
    members?: GroupMember[];
}

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    user?: User;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
}

// --- Category ---
export interface Category {
    id: string;
    name: string;
    icon?: string;        // Emoji like "🥦" or "🧴"
    sortOrder: number;
    isDefault: boolean;
    ownerType: 'SYSTEM' | 'USER' | 'GROUP';
    ownerId?: string;
    createdAt: string;
}

// --- Grocery Entry ---
export interface GroceryEntry {
    id: string;
    name: string;         // Item name, e.g. "Milk"
    amount: number;       // Cost in Rs.
    quantity: number;      // e.g. 2, 0.5, 500
    unit: string;         // Kg, g, L, mL, pcs, dozen, pack
    categoryId: string;
    category?: Category;
    channel: string;      // Zepto, Blinkit, etc.
    purchaseDate: string;
    notes?: string;
    receiptUrl?: string;
    scopeType: 'PERSONAL' | 'GROUP';
    groupId?: string;
    group?: Group;
    addedBy: string;
    addedByUser?: User;
    createdAt: string;
    updatedAt: string;
}

// --- API Request Types ---
export interface CreateEntryRequest {
    name: string;
    amount: number;
    quantity: number;
    unit: string;
    categoryId: string;
    channel: string;
    purchaseDate: string;
    notes?: string;
    scopeType: 'PERSONAL' | 'GROUP';
    groupId?: string;
}

export interface RegisterRequest {
    userId: string;
}

export interface RegisterResponse {
    userId: string;
    uid: string;          // Shown only once!
    displayName: string;
}

export interface LoginRequest {
    userId: string;
    uid: string;
}

export interface CreateGroupRequest {
    name: string;
}

export interface AddMemberRequest {
    uid: string;          // The UID of the person to add (e.g. "GL-7X9K2M")
}

// --- Analytics Types ---
export interface MonthlySummary {
    totalSpend: number;
    itemCount: number;
    uniqueItems: number;
    avgPerEntry: number;
    lastMonthSpend: number;
    percentChange: number;
}

export interface CategorySpend {
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    totalSpend: number;
    percentage: number;
    itemCount: number;
}

export interface ChannelSpend {
    channel: string;
    totalSpend: number;
    percentage: number;
    entryCount: number;
}

export interface ItemAnalytics {
    name: string;
    totalSpend: number;
    totalQuantity: number;
    unit: string;
    avgUnitPrice: number;
    purchaseCount: number;
    avgDaysBetween?: number;
}

export interface SpendTrend {
    date: string;
    amount: number;
}

// --- API Response Wrapper ---
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
