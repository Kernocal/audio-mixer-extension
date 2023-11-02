<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { roundNumber } from '$lib/util/util'

    export let id: string;
    export let src: string;
    export let value: number = 0;
    export let step: number|string = 25;
    export let min: number|string = 0;
    export let max: number|string = 100;
    export let label: string;
    export let disabled: boolean;
    
    let defaultValue = value;
    let width = 70;
    let height = 70;

    onMount(async () => {
        const asd = await import("./webaudio-controls-module")
    });

    const dispatch = createEventDispatcher();

    function setValue(e: Event|MouseEvent) {
        // console.log("event", e);
        var ele = e.target as HTMLInputElement;
        if (e.type === "dblclick") {
            value = defaultValue;
            dispatch('change')
        } else if (e.type === "change") {
            value = Number(ele.value);
            dispatch('change')
        } else {
            value = Number(ele.value);
        }
    }

</script>

<div class="flex flex-col items-center w-fit">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <webaudio-knob
    class="pt-2"
    {id} 
    {src}
    {value}
    {width}
    {height}
    {min}
    {max}
    {step}
    enable={+!disabled}
    on:input={setValue}
    on:change={setValue}
    on:dblclick={setValue}
    />
    <label for={id} class="text-sm text-light-600 p-1 font-medium">{label} 
        <p class="text-center">{roundNumber(value, 2)}</p>
    </label>
</div>