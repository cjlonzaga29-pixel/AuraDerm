export const BANNED_CLAIM_PATTERNS: RegExp[] = [
  /\btreat(s|ment)?\b/i,
  /\bcure(s|d)?\b/i,
  /\bheal(s|ing)?\b/i,
  /\brepair(s)?\b/i,
  /\bclinically proven\b/i,
  /\bmedical-grade\b/i,
  /\bprescription\b/i,
  /\banti-acne\b/i,
  /\beliminates? acne\b/i,
  /\breverses? aging\b/i,
  /\bdermatologist[-\s]approved\b/i,
  // Hair-care label guide: no growth, hair-loss, antifungal or
  // certification claims until (and unless) they are substantiated.
  /\bre-?grows?\b/i,
  /\bhair grower\b/i,
  /\bhair growth\b/i,
  /\bstops? hair loss\b/i,
  /\bantifungal\b/i,
  /\banti-dandruff\b/i,
  /\bcertified (natural|organic)\b/i,
  /\bCOSMOS\b/,
  /\bEcocert\b/i,
  /\bFDA[-\s]approved\b/i,
];

export function findClaims(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of BANNED_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  return matches;
}
