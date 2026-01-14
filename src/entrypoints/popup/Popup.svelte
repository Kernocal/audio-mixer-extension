<script lang='ts'>
    import type { PopUpCommands, Preset, PresetProperties, Properties, Property, StartMixerResponse } from 'lib/types'
    import { storage } from '#imports'
    import { Commands, sendRuntime } from 'lib/messaging/communication'
    import { DEFAULT_PRESETS, MESSAGES } from 'lib/data'
    import { compareObjects } from 'lib/util/util'
    import { emptyPropeties } from 'lib/valueManager'
    import { onMount } from 'svelte'

    import Presets from './Presets.svelte'
    import PropertyControls from './PropertyControls.svelte'

    import 'virtual:uno.css'

    let STATUS = $state<string>(MESSAGES.STATUS_WAITING)

    let PRESETS = $state<Preset[]>(DEFAULT_PRESETS)
    let UI_DISABLED = $state<boolean>(true)
    let ACTIVE_PRESET_INDEX = $state<number>(0)
    let PROPERTIES = $state<Properties>(emptyPropeties())
    $inspect(PRESETS)

    // Debug: Monitor PROPERTIES changes
    $effect(() => {
        console.log('[Popup] PROPERTIES changed:', JSON.stringify(PROPERTIES))
    })

    async function sendCommand(message) {
        const { target = 'background', command, data = {}} = message
        console.log('Sending command', data)
        return await sendRuntime({ target, command, data })
    }
    // data.property, data.value
    // data.tabId

    // function sendCommand(data: PopUpCommands) {
    //     try {
    //         chrome.runtime.sendMessage(data, (response) => {
    //             return response?.message === 'success'
    //         })
    //     }
    //     catch (e) {
    //         console.warn(e)
    //         return false
    //     }
    // }

    function setPreset(presetIndex: number) {
        ACTIVE_PRESET_INDEX = presetIndex
        storage.setItem('session:preset', ACTIVE_PRESET_INDEX)
    }

    async function savePreset(name: string) {
        PRESETS = await storage.getItem<Preset[]>('local:presets') ?? PRESETS
        const { volume: _volume, ...newProperties } = PROPERTIES
        const newPreset = { name, values: (newProperties as PresetProperties) }
        PRESETS.splice((PRESETS.length - 1), 0, newPreset)
        await storage.setItem('local:presets', PRESETS)
    }

    async function deletePreset(presetIndex: number) {
        PRESETS = await storage.getItem<Preset[]>('local:presets') ?? PRESETS
        if (presetIndex !== 0 || presetIndex !== PRESETS.length - 1) {
            PRESETS.splice(presetIndex, 1)
            await storage.setItem('local:presets', PRESETS)
            setValues(PRESETS[0].values, 'GLOBAL')
        }
    }

    function getPresetIndexFromProperties() {
        // If no valid preset found set to the last preset, custom.
        const customIndex = PRESETS.length - 1
        const presetProperties = (({ volume: _volume, ...key }) => key)(PROPERTIES)
        for (let i = 0; i < customIndex; i++) {
            if (compareObjects(PRESETS[i].values, presetProperties)) {
                return i
            }
        }
        return customIndex
    }

    function updateStatusProperty(property: Property) {
        // Splits on capital letter: playbackRate -> ['playback', 'Rate']
        const properties = property.split(/(?=[A-Z])/)
        if (properties.length > 1) {
            return `Updated ${properties[0]} ${properties[1].toLowerCase()}.`
        }
        else {
            return `Updated ${properties[0]}.`
        }
    }

    async function setValue(property: Property, value: number) {
        console.log('Popup setValue: ', property, value)
        if (!UI_DISABLED) {
            const response = await sendCommand({
                target: 'content',
                command: Commands.SET_VALUE,
                data: {
                    property,
                    value
                }
            })
            STATUS = response ? updateStatusProperty(property) : MESSAGES.STATUS_FAILED_COMMAND
            if (property !== 'volume') {
                const presetValues = PRESETS[ACTIVE_PRESET_INDEX].values
                if ((presetValues as PresetProperties)[property] !== value) {
                    const presetIndex = getPresetIndexFromProperties()
                    setPreset(presetIndex)
                }
            }
        }
    }

    function setValues(newValues: StartMixerResponse | object, scope: 'LOCAL' | 'GLOBAL') {
        console.log(`Setting values ${JSON.stringify(newValues)} scope ${scope}`)
        for (const [objKey, objValue] of Object.entries(newValues)) {
            const key: Property = objKey as Property
            const value: number = objValue as number
            if (Object.prototype.hasOwnProperty.call(PROPERTIES, key)) {
                PROPERTIES[key] = value
                if (scope === 'GLOBAL') {
                    setValue(key, value)
                }
            }
        }
    }

    function exitMixer() {
        PROPERTIES.playbackRate = 1
        setValue('playbackRate', PROPERTIES.playbackRate)
        sendCommand({ command: Commands.EXIT_MIXER })
        STATUS = MESSAGES.STATUS_EXIT
        window.close()
    }

    function handlePresetSelect(index: number) {
        setPreset(index)
        setValues(PRESETS[ACTIVE_PRESET_INDEX]?.values, 'GLOBAL')
    }

    function handleTogglePlayback() {
        sendCommand({ command: Commands.TOGGLE_PLAYBACK })
    }

    onMount(async () => {
        PRESETS = await storage.getItem<Preset[]>('local:presets') ?? PRESETS
        ACTIVE_PRESET_INDEX = await storage.getItem<number>('session:preset') ?? ACTIVE_PRESET_INDEX
        chrome.runtime.sendMessage({ command: Commands.START_MIXER }, (response) => {
            if (['Playing.', 'Already playing.'].includes(response.message)) {
                UI_DISABLED = false
                setValues(response, 'LOCAL')
                STATUS = response.message
            }
        })
    })
</script>

<div class='bg animate flex flex-col h-fit min-h-[550px] min-w-[500px] w-fit whitespace-nowrap'>
    <p class='text-white'>{JSON.stringify(PROPERTIES)} </p>
    <p class='text-white'>{UI_DISABLED}</p>
    <div class='grid-parent items-center justify-evenly children:m-2'>
        <PropertyControls
            bind:properties={PROPERTIES}
            disabled={UI_DISABLED}
            onPropertyChange={setValue}
            onTogglePlayback={handleTogglePlayback}
            onExit={exitMixer}
        />
        <Presets
            bind:presets={PRESETS}
            bind:activePresetIndex={ACTIVE_PRESET_INDEX}
            status={STATUS}
            disabled={UI_DISABLED}
            onPresetSelect={handlePresetSelect}
            onPresetSave={savePreset}
            onPresetDelete={deletePreset}
        />

    </div>
</div>

<style>
:global(body) {
    @apply scrollbar scrollbar-rounded scrollbar-w-8px scrollbar-radius-8 scrollbar-thumb-color-mixer-primary scrollbar-track-color-mixer-secondary;
}

.grid-parent {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
}

.bg, .animate {
    background-color: rgba(0, 1, 20, 0.92);
}

.animate {
    animation: bg-animation 60s infinite linear;
}

@keyframes bg-animation {
    0%   { background-color: rgba(0, 1, 20, 0.92); }
    20%   { background-color: rgba(31, 0, 0, 0.92); }
    40%   { background-color: rgba(0, 43, 10, 0.92); }
    60%   { background-color: rgba(17, 0, 31, 0.92); }
    80%   { background-color: rgba(1, 0, 63, 0.92); }
    100%   { background-color: rgba(43, 23, 0, 0.92); }
}
</style>
