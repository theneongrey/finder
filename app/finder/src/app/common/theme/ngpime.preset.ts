//mypreset.ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#C6FDE0',
      100: '#B8EFD3',
      200: '#9CD2B7',
      300: '#82B69D',
      400: '#689B83',
      500: '#4E816A',
      600: '#356852',
      700: '#1B503B',
      800: '#003826',
      900: '#002115',
      950: '#000000',
    },
  },
});
