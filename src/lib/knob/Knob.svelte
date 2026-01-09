<script lang='ts'>
    import { roundNumber } from 'lib/util/util'
    import { onMount } from 'svelte'

    interface Props {
        id: string
        src: string
        value?: number
        step?: number | string
        min?: number | string
        max?: number | string
        label: string
        disabled: boolean
        onchange?: () => void
    }

    let {
        id,
        src,
        value = $bindable(0),
        step = 25,
        min = 0,
        max = 100,
        label,
        disabled,
        onchange,
    }: Props = $props()

    const defaultValue = value
    const width = 70
    const height = 70

    onMount(async () => {
        await import('./webaudio-controls-module')
    })

    function setValue(e: Event | MouseEvent) {
        const ele = e.target as HTMLInputElement
        if (e.type === 'dblclick') {
            value = defaultValue
            onchange?.()
        }
        else if (e.type === 'change') {
            value = Number(ele.value)
            onchange?.()
        }
        else {
            value = Number(ele.value)
        }
    }

</script>

<div class='flex flex-col w-fit items-center'>
    <webaudio-knob
        role='slider'
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabindex='0'
        class='pt-2'
        {id}
        {src}
        {value}
        {width}
        {height}
        {min}
        {max}
        {step}
        enable={disabled ? '0' : '1'}
        oninput={setValue}
        onchange={setValue}
        ondblclick={setValue}
    ></webaudio-knob>
    <label for={id} class='text-sm text-light-600 font-medium p-1'>{label}
        <p class='text-center'>{roundNumber(value, 2)}</p>
    </label>
</div>
