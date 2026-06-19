import { Platform } from 'react-native';

const tintColorLight = '#6C5CE7';
const tintColorDark = '#6C5CE7';

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
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceAlt: '#242836',
  accent: '#6C5CE7',
  accentLight: '#A29BFE',
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#E17055',
  text: '#F1F2F6',
  textMuted: '#8A93A0',
  border: '#2D3142',
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
