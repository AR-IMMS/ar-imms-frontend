export const lightColors = {
  bg: '#F3F6FB',
  bgElevated: '#FFFFFF',
  panel: '#FFFFFF',
  panelStrong: '#F8FAFD',
  panelSoft: '#EEF3FA',
  cardDark: '#F1F5FA',
  cyan: '#315CF5',
  cyanSoft: '#E8EEFF',
  blue: '#315CF5',
  blueSoft: '#E8EEFF',
  green: '#17A673',
  greenSoft: '#E3F7EF',
  purple: '#7457D9',
  purpleSoft: '#EEE9FF',
  amber: '#E69B2E',
  amberSoft: '#FFF3DD',
  red: '#E25562',
  redSoft: '#FDE9EB',
  teal: '#0EA5A8',
  tealSoft: '#DFF7F6',
  border: '#E2E8F0',
  borderBright: '#B8C7F8',
  text: '#101828',
  textMuted: '#667085',
  textSubtle: '#7B879A',
  black: '#071533',
  surface: '#FFFFFF',
  surfaceText: '#101828',
  nav: '#FFFFFF',
  hero: '#071533',
  heroText: '#FFFFFF',
  overlay: 'rgba(7, 21, 51, 0.48)',
};

export const darkColors = {
  bg: '#090E1A',
  bgElevated: '#101827',
  panel: '#121B2D',
  panelStrong: '#172238',
  panelSoft: '#0F1726',
  cardDark: '#0C1423',
  cyan: '#6D8CFF',
  cyanSoft: 'rgba(109, 140, 255, 0.15)',
  blue: '#4E7BFF',
  blueSoft: 'rgba(78, 123, 255, 0.16)',
  green: '#3DDC97',
  greenSoft: 'rgba(61, 220, 151, 0.13)',
  purple: '#A18AFF',
  purpleSoft: 'rgba(161, 138, 255, 0.14)',
  amber: '#F5B84B',
  amberSoft: 'rgba(245, 184, 75, 0.14)',
  red: '#FF7185',
  redSoft: 'rgba(255, 113, 133, 0.14)',
  teal: '#35C7C9',
  tealSoft: 'rgba(53, 199, 201, 0.14)',
  border: '#243149',
  borderBright: '#425A9E',
  text: '#F7F9FC',
  textMuted: '#A5B0C5',
  textSubtle: '#8794AA',
  black: '#050A13',
  surface: '#121B2D',
  surfaceText: '#F7F9FC',
  nav: '#101827',
  hero: '#071127',
  heroText: '#FFFFFF',
  overlay: 'rgba(2, 7, 18, 0.64)',
};

export type ThemeColors = typeof lightColors;

// Kept for legacy screens while they are progressively moved to useTheme().
export const colors = darkColors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 30 };
export const typography = { title: 30, heading: 20, body: 15, small: 12, micro: 10 };

export const shadow = {
  shadowColor: '#101828',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};
