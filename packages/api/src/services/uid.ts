// ============================================================
// GroceryLens API — UID Generation Service
// ============================================================
// This generates the unique codes like "GL-7X9K2M" that users
// need to log in. We use a set of characters that can't be
// confused with each other (no O/0, no I/1/L).
// ============================================================

import crypto from 'crypto';

const UID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const UID_PREFIX = 'GL-';
const UID_LENGTH = 6;
const GROUP_PREFIX = 'GRP-';
const GROUP_CODE_LENGTH = 6;

/**
 * Generate a random code from the safe character set.
 * Uses crypto.randomInt for secure randomness.
 */
function generateCode(length: number, chars: string): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        result += chars[randomIndex];
    }
    return result;
}

/** Generate a user UID like "GL-7X9K2M" */
export function generateUID(): string {
    return UID_PREFIX + generateCode(UID_LENGTH, UID_CHARS);
}

/** Generate a group code like "GRP-4K8N2W" */
export function generateGroupCode(): string {
    return GROUP_PREFIX + generateCode(GROUP_CODE_LENGTH, UID_CHARS);
}
