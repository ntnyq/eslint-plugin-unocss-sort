import { presetWind3 } from '@unocss/preset-wind3'

export default {
  layers: {
    components: 5,
    reset: -10,
    utilities: 20,
  },
  presets: [presetWind3()],
  rules: [
    ['layer-low', { color: 'red' }, { layer: 'reset', sort: 7 }],
    [
      'layer-high',
      { 'background-color': 'blue' },
      { layer: 'utilities', sort: 3 },
    ],
    [
      'multi-prop',
      [
        ['color', 'red'],
        ['--brand', '1'],
      ],
    ],
  ],
  shortcuts: [['btn', 'layer-low layer-high', { layer: 'components' }]],
  theme: {
    breakpoints: {
      desktop: '1280px',
      fluid: 'calc(100vw - 1rem)',
      phone: '30em',
      tablet: '48rem',
    },
  },
}
