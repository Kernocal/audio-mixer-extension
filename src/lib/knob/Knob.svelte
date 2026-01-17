<script lang='ts'>
    import { roundNumber } from 'lib/util/util'

    interface Props {
        id: string
        src?: string // Ignored, kept for API compatibility
        value?: number
        step?: number | string
        min?: number | string
        max?: number | string
        label: string
        disabled: boolean
        onvaluechange?: () => void
    }

    let {
        id,
        src,
        value = $bindable(0),
        step = 1,
        min = 0,
        max = 100,
        label,
        disabled,
        onvaluechange,
    }: Props = $props()

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    function handleInput(_e: Event) {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }
        debounceTimer = setTimeout(() => {
            onvaluechange?.()
        }, 150)
    }

    function handleChange(_e: Event) {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            debounceTimer = null
        }
        onvaluechange?.()
    }

</script>

<div class='knob-container'>
    <label for={id} class='knob-label'>{label}</label>
    <input
        type='range'
        {id}
        class='knob-slider'
        bind:value={value}
        min={min}
        max={max}
        step={step}
        {disabled}
        oninput={handleInput}
        onchange={handleChange}
    />
    <p class='knob-value'>{roundNumber(value, 2)}</p>
</div>

<style>
.knob-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    min-width: 100px;
}

.knob-label {
    font-size: 0.75rem;
    color: #a3a3a3;
    font-weight: 500;
    margin-bottom: 4px;
    text-align: center;
}

.knob-slider {
    width: 80px;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(to right, #6b21a8, #9333ea);
    border-radius: 4px;
    outline: none;
    cursor: pointer;
}

.knob-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #e9d5ff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.knob-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #e9d5ff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.knob-slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.knob-value {
    font-size: 0.875rem;
    color: #d1d5db;
    margin-top: 4px;
    text-align: center;
}
</style>
