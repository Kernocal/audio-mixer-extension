import antfu from '@antfu/eslint-config'

export default antfu(
    {
        unocss: true,
        svelte: true,
        typescript: true,
        yaml: false,
        jsonc: true,
        stylistic: {
            indent: 4,
        },
    },
    {
        ignores: [
            'AGENT.md',
            'src/lib/knob/webaudio-controls-module.ts',
        ],
    },
    {
        rules: {
            'style/max-statements-per-line': ['warn'],
            'no-console': ['warn'],
            '@typescript-eslint/consistent-type-definitions': ['off'],
        },
    },
)
