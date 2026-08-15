import type { UserConfig } from '@unocss/core'
import { presetWind3 } from '@unocss/preset-wind3'

export default {
  presets: [presetWind3()],
  shortcuts: {
    btn: 'inline-flex items-center px-4 py-2',
  },
  theme: {
    breakpoints: {
      desktop: '1280px',
      tablet: '768px',
    },
  },
} satisfies UserConfig
