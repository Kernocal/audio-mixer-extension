import presetWind4 from '@unocss/preset-wind4'
import { defineConfig, transformerDirectives, transformerVariantGroup } from 'unocss'
import { presetScrollbar } from 'unocss-preset-scrollbar'

export default defineConfig({
    presets: [presetWind4(), presetScrollbar()],
    theme: {
        colors: {
            mixer: {
                primary: '#331E36',
                secondary: '#8CFF98',
                tertiary: '#E4BE9E',
            },
        },
    },
    transformers: [transformerVariantGroup(), transformerDirectives()],
})
