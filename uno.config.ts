import { defineConfig, presetUno, transformerVariantGroup } from 'unocss';
import transformerDirectives from '@unocss/transformer-directives';
import { presetScrollbar } from 'unocss-preset-scrollbar'

export default defineConfig({
    presets: [presetUno(), presetScrollbar()],
    theme: {
        colors: {
            'mixer': {
                'primary': '#331E36',
                'secondary': '#8CFF98',
                'tertiary': '#E4BE9E'
            }
        }
    },
    transformers: [transformerDirectives(), transformerVariantGroup()],
})