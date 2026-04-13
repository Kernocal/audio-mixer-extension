<script lang='ts'>
    import type { StorageBinding } from 'lib/storage/items.svelte'
    import type { Preset } from 'lib/types'
    import { i18n } from '#imports'
    import PresetBadges from 'lib/components/PresetBadges.svelte'
    import { sendMessage } from 'lib/messaging'
    import { animatePopup, defaultVolume, includeVolume, knobStyle, playbackRate, presets } from 'lib/storage/items.svelte'
    import { allKnobs } from 'lib/util/knobSprite.svelte'

    let fileInput: HTMLInputElement
    let downloadLink: HTMLAnchorElement
    const customPresets = $derived(presets.value.filter(p => p.user))
    const builtinPresets = $derived(presets.value.filter(p => !p.user))

    function exitMixer() {
        playbackRate.value = 1
        sendMessage('exitMixer')
    }

    async function onFileSelected(e: Event & { currentTarget: HTMLInputElement }) {
        const file = e.currentTarget.files?.[0]
        if (!file)
            return
        const text = await file.text()
        const imported: Preset[] = JSON.parse(text)
        presets.value = [...builtinPresets, ...imported]
        e.currentTarget.value = ''
    }

    function importCustom() {
        exitMixer()
        fileInput.click()
    }

    function exportCustom() {
        exitMixer()
        const blob = new Blob([JSON.stringify(customPresets, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        downloadLink.href = url
        downloadLink.download = 'music-mixer-backup.json'
        downloadLink.click()
        URL.revokeObjectURL(url)
    }

    function resetCustom() {
        exitMixer()
        presets.value = builtinPresets
    }
</script>
{#snippet label(checked: StorageBinding<boolean>, label: string)}
    <label class='toggle'>
        <input type='checkbox' bind:checked={checked.value} />
        <span>{label}</span>
    </label>
{/snippet}

<input bind:this={fileInput} type='file' accept='.json' onchange={onFileSelected} hidden />
<a bind:this={downloadLink} href='google.com' aria-hidden='true' hidden>export</a>

<div class='container'>
    <h3>{i18n.t('ui.labels.settings')}</h3>

    {@render label(animatePopup, i18n.t('ui.labels.popupAnimation'))}
    {@render label(includeVolume, i18n.t('ui.labels.includeVolume'))}

    <label class='toggle'>
        <span>{i18n.t('ui.labels.defaultVolume')}</span>
        <input type='range' min={0} max={1} step={0.01} bind:value={defaultVolume.value} />
        <span>{Math.round(defaultVolume.value * 100)}%</span>
    </label>

    {#await allKnobs() then knobs}
        <div class='knob-picker'>
            {#each knobs as { url, name, size, position } (url)}
                <button
                    class={['knob-option', url === knobStyle.value ? 'selected' : '']}
                    onclick={() => knobStyle.value = url}
                >
                    <div
                        class='knob-preview'
                        style:background-image='url({url})'
                        style:background-size={size}
                        style:background-position-y={position}
                    ></div>
                    <span>{name}</span>
                </button>
            {/each}
        </div>
    {/await}

    <h3>{i18n.t('ui.labels.customPresets')}</h3>

    {#if customPresets.length === 0}
        <p class='empty'>{i18n.t('ui.labels.noCustomPresets')}</p>
    {:else}
        {#each customPresets as preset, i (i)}
            <div class='preset'>
                <span class='name'>{preset.name}</span>
                <div class='props'>
                    <PresetBadges properties={preset.properties} />
                </div>
            </div>
        {/each}
    {/if}

    <div class='actions'>
        <button onclick={importCustom}>{i18n.t('ui.buttons.import').toLowerCase()}</button>
        <button onclick={exportCustom}>{i18n.t('ui.buttons.export').toLowerCase()}</button>
        <button onclick={resetCustom}>{i18n.t('ui.buttons.reset').toLowerCase()}</button>
    </div>
</div>

<style>
    :global(body) {
        background-color: #292a2d;
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 16px;
    }

    .container {
        color: #d7d7d7;
        max-width: 320px;
    }

    h3 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 600;
    }

    .empty {
        font-size: 12px;
        color: #888;
        margin: 4px 0;
    }

    .preset {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        margin-bottom: 4px;
        background: #333;
        border-radius: 4px;
        font-size: 12px;
    }

    .name {
        font-weight: 500;
    }

    .props {
        display: flex;
        gap: 8px;
        color: #999;
        font-size: 11px;
    }

    .actions {
        display: flex;
        gap: 6px;
        margin-top: 10px;
    }

    button {
        background: #444;
        color: #d7d7d7;
        border: none;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 12px;
        cursor: pointer;
    }

    button:hover {
        background: #555;
    }

    .toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        margin-bottom: 12px;
        cursor: pointer;
    }

    .knob-picker {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    .knob-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: #333;
        border: 2px solid transparent;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        color: #999;
        font-size: 10px;
    }

    .knob-option:hover {
        border-color: #555;
    }

    .selected {
        border-color: #9333ea;
        color: #d7d7d7;
    }

    .knob-preview {
        width: 48px;
        height: 48px;
        background-size: 48px auto;
        background-position-y: 50%;
        background-repeat: no-repeat;
    }
</style>
