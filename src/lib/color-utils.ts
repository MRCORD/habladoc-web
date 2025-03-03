// src/lib/color-utils.ts - Utility functions for working with the color system

/**
 * Get RGB color value from CSS variables
 * @param colorName Base name of the color (primary, success, etc.)
 * @param shade Shade of the color (50-900)
 * @param opacity Opacity value (0-1)
 * @returns CSS color value as string
 */
export const getThemeColor = (
    colorName: string, 
    shade: number = 500, 
    opacity: number = 1
  ): string => {
    // Get color from CSS variables
    const cssVar = `var(--color-${colorName}-${shade})`;
    return opacity < 1 
      ? `rgba(var(${cssVar}), ${opacity})` 
      : `rgb(var(${cssVar}))`;
  };
  
  /**
   * Get color with proper dark mode handling
   * @param lightColor Color to use in light mode
   * @param darkColor Color to use in dark mode
   * @returns CSS class string for the color
   */
  export const themeModeColor = (
    lightColor: string,
    darkColor: string
  ): string => {
    return `${lightColor} dark:${darkColor}`;
  };
  
  /**
   * Generate background color with proper opacity and dark mode support
   * @param colorName Base color name
   * @param lightShade Shade to use in light mode
   * @param darkShade Shade to use in dark mode
   * @param lightOpacity Opacity in light mode
   * @param darkOpacity Opacity in dark mode
   * @returns CSS class string for the background
   */
  export const themeBackgroundColor = (
    colorName: string,
    lightShade: number = 100,
    darkShade: number = 900,
    lightOpacity: number = 1,
    darkOpacity: number = 0.3
  ): string => {
    const lightClass = lightOpacity < 1 
      ? `bg-${colorName}-${lightShade}/[${lightOpacity}]` 
      : `bg-${colorName}-${lightShade}`;
    
    const darkClass = darkOpacity < 1 
      ? `dark:bg-${colorName}-${darkShade}/[${darkOpacity}]` 
      : `dark:bg-${colorName}-${darkShade}`;
    
    return `${lightClass} ${darkClass}`;
  };
  
  /**
   * Generate border color with proper dark mode support
   * @param colorName Base color name
   * @param lightShade Shade to use in light mode
   * @param darkShade Shade to use in dark mode
   * @returns CSS class string for the border color
   */
  export const themeBorderColor = (
    colorName: string,
    lightShade: number = 200,
    darkShade: number = 700
  ): string => {
    return `border-${colorName}-${lightShade} dark:border-${colorName}-${darkShade}`;
  };
  
  /**
   * Generate text color with proper dark mode support
   * @param colorName Base color name
   * @param lightShade Shade to use in light mode
   * @param darkShade Shade to use in dark mode
   * @returns CSS class string for the text color
   */
  export const themeTextColor = (
    colorName: string,
    lightShade: number = 700,
    darkShade: number = 300
  ): string => {
    return `text-${colorName}-${lightShade} dark:text-${colorName}-${darkShade}`;
  };
  
  /**
   * Creates badge style classes based on severity or type
   * @param type The type of badge ('success', 'warning', etc.)
   * @returns CSS classes for the badge
   */
  export const getBadgeClass = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'active':
        return themeBackgroundColor('success', 50, 900, 1, 0.2) + ' ' + 
               themeTextColor('success', 700, 300) + ' ' + 
               themeBorderColor('success', 200, 800);
      
      case 'warning':
      case 'moderate':
        return themeBackgroundColor('warning', 50, 900, 1, 0.2) + ' ' + 
               themeTextColor('warning', 700, 300) + ' ' + 
               themeBorderColor('warning', 200, 800);
      
      case 'danger':
      case 'error':
      case 'failed':
      case 'high':
        return themeBackgroundColor('danger', 50, 900, 1, 0.2) + ' ' + 
               themeTextColor('danger', 700, 300) + ' ' + 
               themeBorderColor('danger', 200, 800);
      
      case 'info':
      case 'processing':
        return themeBackgroundColor('info', 50, 900, 1, 0.2) + ' ' + 
               themeTextColor('info', 700, 300) + ' ' + 
               themeBorderColor('info', 200, 800);
      
      case 'primary':
        return themeBackgroundColor('primary', 50, 900, 1, 0.2) + ' ' + 
               themeTextColor('primary', 700, 300) + ' ' + 
               themeBorderColor('primary', 200, 800);
      
      default:
        return themeBackgroundColor('neutral', 100, 800, 1, 1) + ' ' + 
               themeTextColor('neutral', 700, 300) + ' ' + 
               themeBorderColor('neutral', 200, 700);
    }
  };
  
  /**
   * Debug helper for theme colors
   * @returns CSS color values for debugging
   */
  export const getThemeDebugInfo = (): Record<string, string> => {
    return {
      '--color-background': `rgb(var(--color-background))`,
      '--color-foreground': `rgb(var(--color-foreground))`,
      '--color-card': `rgb(var(--color-card))`,
      '--color-input': `rgb(var(--color-input))`,
      '--color-text-primary': `rgb(var(--color-text-primary))`,
      '--color-text-secondary': `rgb(var(--color-text-secondary))`,
      '--color-border': `rgb(var(--color-border))`,
      '--color-primary-500': `rgb(var(--color-primary-500))`,
      '--color-success-500': `rgb(var(--color-success-500))`,
      '--color-warning-500': `rgb(var(--color-warning-500))`,
      '--color-danger-500': `rgb(var(--color-danger-500))`,
      '--color-info-500': `rgb(var(--color-info-500))`,
    };
  };