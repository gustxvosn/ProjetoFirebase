import { Platform } from 'react-native';

const tintColorLight = '#8B5CF6';
const tintColorDark = '#8B5CF6';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F1F2F6',
    background: '#0F1117',
    tint: tintColorDark,
    icon: '#636E83',
    tabIconDefault: '#636E83',
    tabIconSelected: tintColorDark,
  },
};

export const COLORS = {
  background: '#08070D',
  surface: '#12101A',
  surfaceAlt: '#1E1A2B',
  accent: '#8B5CF6',
  accentLight: '#C4B5FD',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F43F5E',
  text: '#F8FAFC',
  textMuted: '#A7A0B8',
  border: '#2D2740',
  white: '#FFFFFF',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
