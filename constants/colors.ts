// ── App Color System ──────────────────────────────────────────────────────────
// Single source of truth for all colors. Import this everywhere instead of
// using raw hex strings so the whole app can be re-themed from one place.
//
// Usage:
//   import { COLORS } from "../constants/colors";
//   backgroundColor: COLORS.primary

// Color system constants
export const COLORS = {
  // Primary colors
  primary:   "#FF6A00", // Orange — CTAs, active states, accents, badges
  secondary: "#2563EB", // Blue   — links, info states
  success:   "#16A34A", // Green  — confirmations, "New" badge
  error:     "#DC2626", // Red    — errors, sale badges, destructive actions

  // Neutral colors
  background:     "#F9FAFB", // App background
  text:           "#111827", // Primary text (almost black)
  textSecondary:  "#6B7280", // Secondary / hint text
  textMuted:      "#9CA3AF", // Placeholders, counts, faint labels
  border:         "#E5E7EB", // Dividers, card borders, input outlines
  surface:        "#FFFFFF", // Cards, modals, inputs

  // Additional tokens for consistency
  accent:          "#FF6A00", // Alias for primary (stars, highlights)
  cardBackground:  "#FFFFFF",
  inputBackground: "#F9FAFB",
  buttonSecondary: "#F3F4F6", // Secondary button fill
  shadow:          "#111827", // Shadow color base

  // Status colors
  deals:   "#DC2626", // Same as error — used for sale/deal pricing
  warning: "#D97706", // Amber — warnings
  info:    "#2563EB", // Same as secondary — info banners

  // Light tint backgrounds (for badges, pills, notifications)
  primaryLight:   "#FFF7ED", // Light orange
  secondaryLight: "#EFF6FF", // Light blue
  successLight:   "#F0FDF4", // Light green
  errorLight:     "#FEF2F2", // Light red
  warningLight:   "#FFFBEB", // Light amber
  infoLight:      "#F5F3FF", // Light purple
} as const;

// Type for color keys
export type ColorKey = keyof typeof COLORS;