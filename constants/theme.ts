/**
 * ChainBazaar Design System
 *
 * Every color, spacing value, radius, shadow, and typography token
 * lives here. Import from this file for new code. Existing screens
 * import from Colors.ts which re-exports AppColors.
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════

export const AppColors = {
  // Backgrounds
  primary:     '#0D0D0D',
  surface:     '#161616',
  surfaceAlt:  '#1C1C1C',
  elevated:    '#222222',
  border:      '#2A2A2A',
  borderLight: '#333333',

  // Text
  secondary:   '#FFFFFF',
  textPrimary: '#F5F5F5',
  textMuted:   '#999999',
  lightGray:   '#808080',
  textDim:     '#555555',

  // Brand
  accent:      '#1E90FF',
  accentSoft:  'rgba(30,144,255,0.12)',
  accentDark:  '#1565C0',

  // Semantic
  success:     '#16C784',
  successSoft: 'rgba(22,199,132,0.12)',
  danger:      '#EA3943',
  dangerSoft:  'rgba(234,57,67,0.12)',
  warning:     '#F5A623',

  // Crypto brand colors
  btcOrange:   '#F7931A',
  ethPurple:   '#627EEA',

  // Legacy compatibility
  gray:        '#1C1C1C',

  // Overlays
  overlay:     'rgba(0,0,0,0.6)',
  overlayLight:'rgba(0,0,0,0.4)',
} as const;

// Light/dark for Expo template components
export const Colors = {
  light: {
    text: AppColors.secondary,
    background: AppColors.primary,
    tint: AppColors.accent,
    icon: AppColors.lightGray,
    tabIconDefault: AppColors.lightGray,
    tabIconSelected: AppColors.accent,
  },
  dark: {
    text: AppColors.secondary,
    background: AppColors.primary,
    tint: AppColors.accent,
    icon: AppColors.lightGray,
    tabIconDefault: AppColors.lightGray,
    tabIconSelected: AppColors.accent,
  },
};

// ═══════════════════════════════════════════════════════════════
// REACT NAVIGATION THEME
// ═══════════════════════════════════════════════════════════════

export const ChainBazaarNavTheme = {
  dark: true,
  colors: {
    primary:      AppColors.accent,
    background:   AppColors.primary,
    card:         AppColors.primary,
    text:         AppColors.secondary,
    border:       AppColors.border,
    notification: AppColors.danger,
  },
  fonts: {
    regular: { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }), fontWeight: '400' as const },
    medium:  { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }), fontWeight: '500' as const },
    bold:    { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }), fontWeight: '700' as const },
    heavy:   { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }), fontWeight: '900' as const },
  },
};

// ══════════════════════════���════════════════════════════════════
// FONTS
// ═══════════════════════════════════════════════════════════════

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, monospace",
  },
});

// ═══════════════════════════════════════════════════════════════
// SPACING (4px base grid)
// ═══════════════════════════════════════════════════════════════

export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
  huge:40,
} as const;

// ═══════════════════════════════════════════════════════════════
// RADII
// ═══════════════════════════════════════════════════════════════

export const Radii = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  pill: 100,
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
  /** Colored glow for CTAs — pass a color to shadowColor */
  glow: (color: string): ViewStyle => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
};

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export const Typography = StyleSheet.create({
  h1:       { fontSize: 28, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.5 } as TextStyle,
  h2:       { fontSize: 22, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 } as TextStyle,
  h3:       { fontSize: 18, fontWeight: '600', color: AppColors.textPrimary } as TextStyle,
  body:     { fontSize: 15, fontWeight: '400', color: AppColors.textPrimary, lineHeight: 22 } as TextStyle,
  bodyBold: { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary, lineHeight: 22 } as TextStyle,
  caption:  { fontSize: 12, fontWeight: '500', color: AppColors.textMuted } as TextStyle,
  label:    { fontSize: 11, fontWeight: '700', color: AppColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 } as TextStyle,
  price:    { fontSize: 20, fontWeight: '800', color: AppColors.success } as TextStyle,
  priceSm:  { fontSize: 16, fontWeight: '700', color: AppColors.success } as TextStyle,
  crypto:   { fontSize: 12, fontWeight: '500', color: AppColors.textMuted } as TextStyle,
});

// ═══════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════

export const SharedStyles = StyleSheet.create({
  // Screens
  screen: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },

  // Cards
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: AppColors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.glow(AppColors.accent),
  },
  buttonPrimaryText: {
    color: AppColors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSuccess: {
    backgroundColor: AppColors.success,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.glow(AppColors.success),
  },
  buttonDanger: {
    backgroundColor: AppColors.danger,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: AppColors.accent,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: AppColors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Inputs
  input: {
    backgroundColor: AppColors.surfaceAlt,
    color: AppColors.secondary,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
  },

  // Chips
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceAlt,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  chipActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  chipTextActive: {
    color: AppColors.secondary,
  },
});