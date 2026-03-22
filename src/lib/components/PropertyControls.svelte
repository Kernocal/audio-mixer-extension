<script lang='ts'>
    import type { ToneProperty } from 'lib/types'
    import { i18n } from '#imports'
    import knobSprite from 'lib/assets/SmallLedKnob2.png'
    import Knob from 'lib/components/Knob.svelte'
    import { popupLogger } from 'lib/logger'
    import { sendMessage } from 'lib/messaging'
    import { pitch, pitchWet, playbackRate, reverbDecay, reverbWet, togglePlayback, volume } from 'lib/storage/items.svelte'

    interface Props {
        disabled: boolean
        onExit: () => void
    }

    const { disabled, onExit }: Props = $props()
    let frameCount = $state<number>(0)

    function onToneChange(property: ToneProperty, value: number) {
        popupLogger.debug('Popup setting value: ', property, value)
        sendMessage('setOffscreenValue', { property, value })
    }

    $effect(() => {
        const img = new Image()
        img.onload = () => {
            frameCount = Math.round(img.naturalHeight / img.naturalWidth) - 1
        }
        img.src = knobSprite
    })

</script>

<div class='grid-child1'>
    <div class={`rounded-md ${pitch.value > 0 ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10'}`}>
        <h1 class='propertyText'>{i18n.t('ui.labels.pitch')}</h1>
        <div class='flex justify-around'>
            <Knob id='pitch' label={i18n.t('ui.labels.semitoneShift')} bind:value={pitch.value} min={-12} max={12} step={1} src={knobSprite} {frameCount} disabled={disabled} onvaluechange={() => { onToneChange('pitch', pitch.value) }} />
            <Knob id='pitchWet' label={i18n.t('ui.labels.activeAmount')} bind:value={pitchWet.value} min={0} max={1} step={0.01} src={knobSprite} {frameCount} disabled={disabled} onvaluechange={() => { onToneChange('pitchWet', pitchWet.value) }} />
        </div>
    </div>
    <div class={`rounded-md mt-2 ${reverbWet.value > 0 ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10'}`}>
        <h1 class='propertyText'>{i18n.t('ui.labels.reverb')}</h1>
        <div class='flex justify-around'>
            <Knob id='reverb' label={i18n.t('ui.labels.decay')} bind:value={reverbDecay.value} min={0.01} max={10} step={0.10} src={knobSprite} {frameCount} disabled={disabled} onvaluechange={() => { onToneChange('reverbDecay', reverbDecay.value) }} />
            <Knob id='reverbWet' label={i18n.t('ui.labels.activeAmount')} bind:value={reverbWet.value} min={0} max={1} step={0.01} src={knobSprite} {frameCount} disabled={disabled} onvaluechange={() => { onToneChange('reverbWet', reverbWet.value) }} />
        </div>
    </div>
    <div class='mt-2 rounded-md bg-mixer-secondary/30 whitespace-nowrap'>
        <h1 class='propertyText'>{i18n.t('ui.labels.mediaSettings')}</h1>
        <div class='flex justify-around'>
            <Knob id='volume' label={i18n.t('ui.labels.volume')} bind:value={volume.value} min={0} max={1} step={0.01} src={knobSprite} {frameCount} disabled={disabled} />
            <Knob id='playbackRate' label={i18n.t('ui.labels.playbackRate')} bind:value={playbackRate.value} min={0.1} max={2} step={0.05} src={knobSprite} {frameCount} disabled={disabled} />
        </div>
    </div>
    <div class='flex items-center justify-between'>
        <button class='button' disabled={disabled} onclick={() => { togglePlayback.value = true }}>{i18n.t('ui.buttons.playPause')}</button>
        <button class='button' onclick={onExit}>{i18n.t('ui.buttons.quit')}</button>
    </div>
</div>

<style lang='postcss'>
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
