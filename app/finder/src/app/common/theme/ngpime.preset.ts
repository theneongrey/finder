//mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#E3F3FF',
      100: '#C3E8FF',
      200: '#83D0FA',
      300: '#67B4DD',
      400: '#4999C1',
      500: '#297FA6',
      600: '#00668A',
      700: '#004C68',
      800: '#003549',
      900: '#001E2C',
      950: '#000000',
    },
  },
});
