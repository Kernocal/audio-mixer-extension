<script lang='ts'>
    import type { Preset } from 'lib/types'
    import GitHub from 'lib/assets/github.png'

    interface Props {
        presets: Preset[]
        activePresetIndex: number
        status: string
        disabled: boolean
        onPresetSelect: (index: number) => void
        onPresetSave: (name: string) => Promise<void>
        onPresetDelete: (index: number) => Promise<void>
    }

    let {
        presets = $bindable(),
        activePresetIndex = $bindable(),
        status,
        disabled,
        onPresetSelect,
        onPresetSave,
        onPresetDelete,
    }: Props = $props()

    let SAVE_PRESET_HIDDEN = $state(true)
    let NEW_PRESET_NAME = $state('')

    function handleSave() {
        onPresetSave(NEW_PRESET_NAME)
        SAVE_PRESET_HIDDEN = true
        NEW_PRESET_NAME = ''
    }

    function handleCancel() {
        SAVE_PRESET_HIDDEN = true
        NEW_PRESET_NAME = ''
    }
</script>

{#if !SAVE_PRESET_HIDDEN}
    <div class='bg-black/80 flex h-100% w-100% items-center justify-center fixed z-1'>
        <div class='p-3 rounded-md bg-mixer-secondary/30 flex flex-col w-fit'>
            <h1 class='propertyText'>New Preset Name</h1>
            <input type='text' name='presetName' class='m-2 p-2 w-32' bind:value={NEW_PRESET_NAME}>
            <div>
                <button class='button' onclick={handleSave}>Save</button>
                <button class='button' onclick={handleCancel}>Cancel</button>
            </div>
        </div>
    </div>
{/if}

<div class='grid-child2 flex flex-col h-99% items-center self-start'>
    <h1 class='propertyText'>Presets</h1>
    <div class='pb-2 pl-2 pt-1 flex flex-col w-100% children:(rounded-md)'>
        {#each presets as preset, i}
            <label class={`font-medium cursor-pointer mb-1 p-2 pr-4 hover:(bg-mixer-secondary/30) ${activePresetIndex === i && !disabled ? 'bg-mixer-secondary/30' : 'bg-mixer-secondary/10'}`}>
                <input
                    class='radio mx-2 mt-auto'
                    type='radio'
                    name='activePreset'
                    disabled={disabled || (activePresetIndex === 0 && presets.length - 1 === i)}
                    bind:group={activePresetIndex}
                    value={i}
                    onclick={() => onPresetSelect(i)}
                >
                <span class='text-sm text-light-600 m-auto'>{preset.name}</span>
            </label>
        {/each}
    </div>
    {#if presets[activePresetIndex]?.name === 'Custom'}
        <button class='button pt-1' disabled={disabled} onclick={() => { SAVE_PRESET_HIDDEN = false }}>Save preset</button>
    {:else}
        <button class='button pt-1' disabled={disabled || activePresetIndex === 0} onclick={() => onPresetDelete(activePresetIndex)}>Delete preset</button>
    {/if}
    <p class={`text-light-600 p-1 w-fit whitespace-pre-line ${(status.length > 80 ? 'text-xs' : 'text-sm')}`}>{status}</p>
    <a title='Get help on GitHub!' class='mb-4 mr-2 mt-auto self-end hover:opacity-75' href='https://github.com/Kernocal/audio-mixer-extension' target='_blank'>
        <img src={GitHub} alt="" class='filter-svg max-h-6 max-w-6 min-h-6 min-w-6' />
    </a>
</div>

<style>
.radio {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin: 0;
    @apply rounded-[9999px] border-purple-900;
    height: 1rem;
    width: 1rem;
    border-radius: 9999px;
    border-width: 1px;
}
.radio:checked {
    @apply bg-purple-600 shadow-purple;
}

.radio:disabled, .radio:active:disabled {
    @apply bg-transparent border-dark-950;
}

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

.grid-child2 {
    grid-area: 1 / 2 / 2 / 3;
}

.filter-svg {
    filter: invert(14%) sepia(65%) saturate(6557%) hue-rotate(272deg) brightness(89%) contrast(91%);
}
</style>
