import { defineConfig, presetUno, transformerVariantGroup } from 'unocss';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
    presets: [presetUno()],
    transformers: [transformerDirectives(), transformerVariantGroup()],
})