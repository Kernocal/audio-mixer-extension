<script lang='ts'>
    import type { Preset } from 'lib/types'
    import { sendMessage } from 'lib/messaging'
    import { animation, knobStyle, playbackRate, presets } from 'lib/storage/items.svelte'
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

<input bind:this={fileInput} type='file' accept='.json' onchange={onFileSelected} hidden />
<a bind:this={downloadLink} href='google.com' aria-hidden='true' hidden>export</a>

<div class='container'>
    <h3>Settings</h3>

    <label class='toggle'>
        <input type='checkbox' bind:checked={animation.value} />
        <span>Popup background animation</span>
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

    <h3>Custom Presets</h3>

    {#if customPresets.length === 0}
        <p class='empty'>No custom presets</p>
    {:else}
        {#each customPresets as preset (preset.name)}
            <div class='preset'>
                <span class='name'>{preset.name}</span>
                <div class='props'>
                    <span>speed {preset.properties.playbackRate}</span>
                    <span>pitch {preset.properties.pitch}</span>
                    <span>reverb {preset.properties.reverbDecay}</span>
                </div>
            </div>
        {/each}
    {/if}

    <div class='actions'>
        <button onclick={importCustom}>import</button>
        <button onclick={exportCustom}>export</button>
        <button onclick={resetCustom}>reset</button>
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
