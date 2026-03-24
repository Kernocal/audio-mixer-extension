<script lang='ts'>

    interface Props {
        id: string
        value: number
        min: number
        max: number
        step: number
        sensitivity?: number
        disabled?: boolean
        size?: number
        frameCount?: number
        label: string
        src: string
        onvaluechange?: (value: number) => void
    }

    let {
        id,
        value = $bindable(0),
        min = 0,
        max = 100,
        step = 1,
        sensitivity = 1,
        disabled = false,
        size = 72,
        frameCount = 0,
        label,
        src,
        onvaluechange,
    }: Props = $props()

    const ratio = $derived(max === min ? 0 : (value - min) / (max - min))
    const frameIndex = $derived(Math.round(ratio * frameCount))
    const resetValue = value
    const backgroundSize = $derived(`${size}px ${size * (frameCount + 1)}px`)
    const backgroundPositionY = $derived(`${-frameIndex * size}px`)

    let startY = 0
    let startX = 0
    let startValue = 0
    let lastShift = false
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    function clampAndStep(v: number): number {
        if (step) {
            v = Math.round((v - min) / step) * step + min
        }
        return Number(Math.min(max, Math.max(min, v)).toFixed(6))
    }

    function notify(debounce = false) {
        if (debounceTimer)
            clearTimeout(debounceTimer)
        if (debounce) {
            debounceTimer = setTimeout(() => onvaluechange?.(value), 150)
        }
        else {
            debounceTimer = null
            onvaluechange?.(value)
        }
    }

    function setValue(v: number, debounce = false) {
        const clamped = clampAndStep(v)
        if (clamped !== value) {
            value = clamped
            notify(debounce)
        }
    }

    function onpointerdown(e: PointerEvent) {
        if (disabled)
            return
        if (e.button !== 0)
            return

        // Ctrl/Cmd + click → reset to default
        if (e.ctrlKey || e.metaKey) {
            setValue(resetValue)
            return
        }

        const el = e.currentTarget as HTMLElement
        el.setPointerCapture(e.pointerId)
        el.focus()

        startY = e.clientY
        startX = e.clientX
        startValue = value
        lastShift = e.shiftKey
    }

    function onpointermove(e: PointerEvent) {
        if (disabled)
            return
        const el = e.currentTarget as HTMLElement
        if (!el.hasPointerCapture(e.pointerId))
            return

        // reset drag origin
        if (e.shiftKey !== lastShift) {
            lastShift = e.shiftKey
            startY = e.clientY
            startX = e.clientX
            startValue = value
        }

        const offset = (startY - e.clientY - startX + e.clientX) * sensitivity
        const divisor = (e.shiftKey ? 4 : 1) * 128
        const rawValue = startValue + ((max - min) * offset) / divisor
        setValue(rawValue, true)
    }

    function onpointerup(e: PointerEvent) {
        const el = e.currentTarget as HTMLElement
        if (el.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId)
            notify()
        }
    }

    function onwheel(e: WheelEvent) {
        if (disabled)
            return
        e.preventDefault()
        let delta = e.shiftKey ? step : Math.max(step, (max - min) * 0.05)
        delta = e.deltaY > 0 ? -delta : delta
        setValue(value + delta, true)
    }

    function onkeydown(e: KeyboardEvent) {
        if (disabled)
            return
        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowRight':
                setValue(value + step)
                break
            case 'ArrowDown':
            case 'ArrowLeft':
                setValue(value - step)
                break
            case 'Home':
                setValue(min)
                break
            case 'End':
                setValue(max)
                break
            default:
                return
        }
        e.preventDefault()
    }
</script>

<div class='knob-wrapper'>
    <div
        class='knob'
        {id}
        role='slider'
        tabindex={disabled ? -1 : 0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        aria-labelledby={`${id}-label`}
        aria-disabled={disabled}
        style:width='{size}px'
        style:height='{size}px'
        style:background-image='url({src})'
        style:background-size={backgroundSize}
        style:background-position-y={backgroundPositionY}
        class:disabled
        {onpointerdown}
        {onpointermove}
        {onpointerup}
        {onwheel}
        {onkeydown}
    ></div>
    <div class='pb-2'>
        <div id={`${id}-label`} class='knob-label'>{label}</div>
        <p class='knob-value'>{Number(value.toFixed(2))}</p>
    </div>
</div>

<style>
.knob-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
}

.knob {
    cursor: grab;
    touch-action: none;
    outline: none;
    background-repeat: no-repeat;
}

.knob:active {
    cursor: grabbing;
}

.knob:focus-visible {
    outline: 2px solid #9333ea;
    outline-offset: 2px;
    border-radius: 50%;
}

.knob.disabled {
    cursor: not-allowed;
    pointer-events: none;
}

.knob-label {
    font-size: 0.875rem;
    color: #d4d4d8;
    font-weight: 500;
}

.knob-value {
    font-size: 0.875rem;
    color: #d1d5db;
    font-weight: 500;
    text-align: center;
}
</style>
