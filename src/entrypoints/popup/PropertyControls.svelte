<script lang='ts'>
    import type { Properties, Property } from 'lib/types'
    import CarbonKnobSrc from 'lib/assets/CarbonPurple.png'
    import SmallKnobSrc from 'lib/assets/SmallLedKnob2.png'
    import Knob from 'lib/knob/Knob.svelte'

    interface Props {
        properties: Properties
        disabled: boolean
        onPropertyChange: (property: Property, value: number) => void
        onTogglePlayback: () => void
        onExit: () => void
    }

    let {
        properties = $bindable(),
        disabled,
        onPropertyChange,
        onTogglePlayback,
        onExit,
    }: Props = $props()
</script>

<div class='grid-child1'>
    <div class={`rounded-md ${properties.pitchWet > 0 ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10'}`}>
        <h1 class='propertyText'>Pitch</h1>
        <div class='flex justify-around'>
            <Knob id='pitch' label='Semitone Shift:' src={SmallKnobSrc} bind:value={properties.pitch} min='-12' max='12' step='1' disabled={disabled} onvaluechange={() => { onPropertyChange('pitch', properties.pitch) }} />
            <Knob id='pitchWet' label='Active amount:' src={CarbonKnobSrc} bind:value={properties.pitchWet} min='0' max='1' step='0.01' disabled={disabled} onvaluechange={() => { onPropertyChange('pitchWet', properties.pitchWet) }} />
        </div>
    </div>
    <div class={`rounded-md mt-2 ${properties.reverbWet > 0 ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10'}`}>
        <h1 class='propertyText'>Reverb</h1>
        <div class='flex justify-around'>
            <Knob id='reverb' label='Decay:' src={SmallKnobSrc} bind:value={properties.reverbDecay} min='0.01' max='10' step='0.10' disabled={disabled} onvaluechange={() => { onPropertyChange('reverbDecay', properties.reverbDecay) }} />
            <Knob id='reverbWet' label='Active amount:' src={CarbonKnobSrc} bind:value={properties.reverbWet} min='0' max='1' step='0.01' disabled={disabled} onvaluechange={() => { onPropertyChange('reverbWet', properties.reverbWet) }} />
        </div>
    </div>
    <div class='mt-2 rounded-md bg-mixer-secondary/30 whitespace-nowrap'>
        <h1 class='propertyText'>Media Settings</h1>
        <div class='flex justify-around'>
            <Knob id='volume' label='Volume:' src={SmallKnobSrc} bind:value={properties.volume} min='0' max='1' step='0.01' disabled={disabled} onvaluechange={() => { onPropertyChange('volume', properties.volume) }} />
            <Knob id='playbackRate' label='Playback Rate:' src={SmallKnobSrc} bind:value={properties.playbackRate} min='0.1' max='2' step='0.05' disabled={disabled} onvaluechange={() => { onPropertyChange('playbackRate', properties.playbackRate) }} />
        </div>
    </div>
    <div class='flex items-center justify-between'>
        <button class='button' disabled={disabled} onclick={onTogglePlayback}>Play/Pause</button>
        <button class='button' onclick={onExit}>Quit</button>
    </div>
</div>

<style>
.propertyText {
    @apply text-light-600 text-lg p-1 pl-2 font-medium;
}

.button {
    @apply w-fit h-fit p-2 m-2 bg-purple-700 rounded-md text-white;
}
.button:active:enabled {
    @apply ring-4 ring-light-200/25;
}
.button:hover:enabled {
    @apply opacity-80;
}
.button:disabled {
    @apply bg-purple-950/20 cursor-not-allowed;
}

.grid-child1 {
    grid-area: 1 / 1 / 2 / 2;
}
</style>
