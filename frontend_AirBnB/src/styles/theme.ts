// AirBnB Color Theme
export const colors = {
  // Primary colors (AirBnB Red)
  primary: '#FF385C',
  primaryHover: '#E03352',
  primaryActive: '#CC2C4A',
  primaryLight: '#FF5A7F',
  primaryLighter: '#FFE5EA',
  
  // Neutral colors
  text: '#222222',
  textSecondary: '#717171',
  textTertiary: '#8C8C8C',
  textLight: '#B0B0B0',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F7F7F7',
  backgroundTertiary: '#F5F5F5',
  
  // Border colors
  border: '#DDDDDD',
  borderLight: '#EBEBEB',
  borderHover: '#B0B0B0',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowHover: 'rgba(0, 0, 0, 0.18)',
  shadowPrimary: 'rgba(255, 56, 92, 0.2)',
  shadowPrimaryHover: 'rgba(255, 56, 92, 0.3)',
  
  // Status colors
  success: '#00A699',
  error: '#FF385C',
  warning: '#FFB400',
  info: '#0088CC',
  
  // Gradient
  gradientPrimary: 'linear-gradient(135deg, #FF385C 0%, #E03352 100%)',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '22px',
  full: '50%',
  pill: '9999px',
} as const;

export const typography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const;

