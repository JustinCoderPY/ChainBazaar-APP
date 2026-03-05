/**
 * Re-exports AppColors as Colors so every existing import
 *   import { Colors } from '../constants/Colors';
 * continues to work without modification.
 */
export { AppColors as Colors } from './theme';

export const AppColors = {
  primary: '#0B1220',     // background
  secondary: '#FFFFFF',   // main text (use white if your UI is dark)
  lightGray: '#9CA3AF',

  accent: '#1D4ED8',
  accentSoft: 'rgba(29, 78, 216, 0.15)',

  success: '#22C55E',
  danger: '#EF4444',

  // Nice to have (clean + consistent)
  onAccent: '#FFFFFF',
  onDanger: '#FFFFFF',

  btcOrange: '#F7931A',
  ethPurple: '#8A92B2',
};