<script lang='ts'>
    import type { Preset, ToneProperty } from 'lib/types'
    import { i18n } from '#imports'
    import GitHub from 'lib/assets/github.png'
    import { popupLogger } from 'lib/logger'
    import { sendMessage } from 'lib/messaging'
    import { pitch, pitchWet, playbackRate, presets, reverbDecay, reverbWet } from 'lib/storage/items.svelte'

    interface Props {
        status: string
        disabled: boolean
    }

    const {
        status,
        disabled,
    }: Props = $props()

    let dialog: HTMLDialogElement
    let NEW_PRESET_NAME = $state('')
    const activePresetIndex = $derived.by(() => {
        const current = {
            pitch: pitch.value,
            pitchWet: pitchWet.value,
            reverbDecay: reverbDecay.value,
            reverbWet: reverbWet.value,
            playbackRate: playbackRate.value,
        }
        const index = presets.value.findIndex(p =>
            Object.entries(p.properties).every(([k, v]) => current[k as keyof typeof current] === v),
        )
        return index === -1 ? null : index
    })
    const activePreset = $derived(activePresetIndex !== null ? presets.value[activePresetIndex] : null)

    function handleSave() {
        savePreset(NEW_PRESET_NAME)
        dialog.close()
    }

    function savePreset(name: string) {
        const newPreset: Preset = {
            name,
            user: true,
            properties: {
                pitch: pitch.value,
                pitchWet: pitchWet.value,
                reverbDecay: reverbDecay.value,
                reverbWet: reverbWet.value,
                playbackRate: playbackRate.value,
            },
        }
        presets.update(cur => [...cur, newPreset])
    }

    function deletePreset(index: number) {
        presets.update(cur => cur.filter((_, i) => i !== index))
    }

    function applyPreset(preset: Preset) {
        popupLogger.debug(`Setting Preset ${JSON.stringify(preset)}`)
        const storageMap = { pitch, pitchWet, reverbDecay, reverbWet, playbackRate } as const
        for (const [key, value] of Object.entries(preset.properties)) {
            storageMap[key as keyof typeof storageMap].value = value as number
            if (key !== 'playbackRate') {
                sendMessage('setOffscreenValue', { property: key as ToneProperty, value: value as number })
            }
        }
    }

</script>

<dialog bind:this={dialog} onclose={() => { NEW_PRESET_NAME = '' }}>
    <div class='p-3 rounded-md bg-mixer-secondary/30 flex flex-col w-fit'>
        <h1 class='propertyText'>{i18n.t('ui.labels.newPresetName')}</h1>
        <input type='text' name='presetName' class='m-2 p-2 w-32' bind:value={NEW_PRESET_NAME}>
        <div>
            <button class='button' onclick={handleSave}>{i18n.t('ui.buttons.save')}</button>
            <button class='button' onclick={() => dialog.close()}>{i18n.t('ui.buttons.cancel')}</button>
        </div>
    </div>
</dialog>

<div class='grid-child2 flex flex-col gap-2 h-full min-h-0 w-full items-center overflow-hidden'>
    <h1 class='propertyText'>{i18n.t('ui.labels.presets')}</h1>
    <div class='custom-scrollbar pb-2 pl-2 pt-1 flex flex-1 flex-col w-full overflow-y-scroll children:(rounded-md)'>
        {#each presets.value as preset, i}
            <label
                class={['font-medium cursor-pointer mb-1 p-2 pr-4 hover:(bg-mixer-secondary/30)', activePresetIndex === i && !disabled ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10']}>
                <input
                    class='radio mx-2 mt-auto'
                    type='radio'
                    name='activePreset'
                    disabled={disabled}
                    checked={activePresetIndex === i}
                    value={i}
                    onclick={() => applyPreset(preset)}
                >
                <span class='text-sm text-light-600 m-auto'>{preset.user ? preset.name : i18n.t(preset.name as any)}</span>
            </label>
        {/each}
        <label
            class={['font-medium mb-1 p-2 pr-4', activePresetIndex === null && !disabled ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10']}>
            <input
                class='radio mx-2 mt-auto'
                type='radio'
                name='activePreset'
                disabled
                checked={activePresetIndex === null}
            >
            <span class='text-sm text-light-600 m-auto'>{i18n.t('ui.labels.custom')}</span>
        </label>
    </div>
    <div class='px-1 pb-1 flex shrink-0 w-full items-center justify-center'>
        {#if activePresetIndex !== null}
            <button
                class='button w-[calc(50%-1rem)]'
                disabled={disabled || !activePreset?.user}
                onclick={() => deletePreset(activePresetIndex!)}>
                {i18n.t('ui.buttons.deletePreset')}
            </button>
        {:else}
            <button class='button w-[calc(50%-1rem)]' disabled={disabled} onclick={() => dialog.showModal()}>{i18n.t('ui.buttons.savePreset')}</button>
        {/if}
    </div>
    <div class='mb-2 mt-auto px-1 text-center flex min-h-6 w-full items-center justify-center relative'>
        <p class={['text-light-600 p-1 w-fit whitespace-pre-line', status.length > 80 ? 'text-xs' : 'text-sm']}>{status}</p>
        <a title='Get help on GitHub!' class='right-1 absolute hover:opacity-75' href='https://github.com/Kernocal/audio-mixer-extension' target='_blank'>
            <img src={GitHub} alt="" class='filter-svg max-h-6 max-w-6 min-h-6 min-w-6' />
        </a>
    </div>
</div>

<style lang='postcss'>

.custom-scrollbar::-webkit-scrollbar {
    width: 0.5rem;
    border-radius: 0.5rem;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(168, 85, 247, 0.5);
    border-radius: 0.5rem;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(168, 85, 247, 0.8);
}

dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.8);
}

dialog {
    background: transparent;
    border: none;
    padding: 0;
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
}

.radio {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin: 0;
    @apply rounded-[9999px] border-purple-900;
    height: 1rem;
    width: 1rem;
    border-radius: 9999px;
    border-width: 0.0625rem;
}
.radio:checked {
    @apply bg-purple-600 shadow-purple;
}

.radio:checked:disabled {
    @apply bg-purple-600 shadow-purple border-purple-900;
}

.radio:disabled, .radio:active:disabled {
    @apply bg-transparent border-dark-950;
}

.propertyText {
    @apply text-light-600 text-lg p-1 font-medium text-center;
}

.button {
    @apply p-2 m-2 bg-purple-700 rounded-md text-white;
}
.button:active:enabled {
    @apply ring-4 ring-light-200/25;
}
.button:hover:enabled {
    @apply opacity-80;
}
.button:disabled {
    @apply opacity-50 cursor-not-allowed;
}

.grid-child2 {
    grid-area: 1 / 2 / 2 / 3;
}

.filter-svg {
    filter: invert(14%) sepia(65%) saturate(6557%) hue-rotate(272deg) brightness(89%) contrast(91%);
}
</style>
