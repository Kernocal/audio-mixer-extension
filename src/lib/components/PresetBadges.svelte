<script lang='ts'>
    import type { PresetProperties } from 'lib/types'
    import { i18n } from '#imports'
    import { DEFAULT_PROPERTIES } from 'lib/storage/items'
    import { includeVolume } from 'lib/storage/items.svelte'

    interface Props {
        properties: PresetProperties
    }

    const { properties }: Props = $props()

    const labels: Partial<Record<keyof PresetProperties, string>> = {
        playbackRate: 'ui.badges.playbackRate',
        pitch: 'ui.badges.pitch',
        reverbDecay: 'ui.badges.reverb',
        volume: 'ui.badges.volume',
    }

    const keys = Object.keys(labels) as (keyof PresetProperties)[]

    function isNonDefault(key: keyof PresetProperties) {
        if (key === 'volume' && !includeVolume.value)
            return false
        return properties[key] !== undefined && properties[key] !== DEFAULT_PROPERTIES[key]
    }

    const badges = $derived(keys.filter(isNonDefault))
</script>

{#each badges as key}
    {@const label = i18n.t(labels[key] as any)}
    <span
        class='text-[0.5625rem] text-light-600/50 leading-none font-normal px-1 py-0.5 rounded bg-purple-900/40'
        title='{label}: {properties[key]}'>
        {label}
    </span>
{/each}
