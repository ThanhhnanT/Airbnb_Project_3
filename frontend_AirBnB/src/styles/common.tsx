// AirBnB Theme Colors - Single source of truth
export const themeColors = {
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
} as const;

// Legacy function for AntProvider compatibility
export const commonStyle = (): {
  primaryColor: string;
  btnColor: string;
  btnHoverColor: string;
  btnActiveColor: string;
} => {
  return {
    primaryColor: themeColors.primary,
    btnColor: themeColors.primary,
    btnHoverColor: themeColors.primaryHover,
    btnActiveColor: themeColors.primaryActive
  };
};
