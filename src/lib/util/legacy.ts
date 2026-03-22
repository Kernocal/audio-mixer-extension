import type { Browser } from '#imports'
import type { PresetProperties } from 'lib/types'
import { backgroundLogger } from 'lib/logger'
import { presets } from 'lib/storage/items'

export interface OldPreset {
    name: string
    values: PresetProperties
}

export async function fixLegacyPresets(details: Browser.runtime.InstalledDetails) {
    if (details.reason === 'update' && details.previousVersion && details.previousVersion < '1.5.2') {
        backgroundLogger.debug('we updating')
        backgroundLogger.debug('currect storage', await presets.getValue())
        const oldPresets = (await presets.getValue() as unknown) as OldPreset[]
        const ignorePresets = ['Default/Reset', 'Classic Nightcore', '(slowed + reverb)', 'Roomy Reverb', 'Custom']
        const filteredPresets = oldPresets.filter(p => !ignorePresets.includes(p.name))
        const convertedPresets = filteredPresets.map((p) => {
            return {
                name: p.name,
                user: true,
                properties: {
                    playbackRate: p.values.playbackRate,
                    pitch: p.values.pitch,
                    pitchWet: p.values.pitchWet,
                    reverbDecay: p.values.reverbDecay,
                    reverbWet: p.values.reverbWet,
                },
            }
        })
        backgroundLogger.debug('trying to fix', filteredPresets)
        await presets.setValue([...presets.fallback, ...convertedPresets])
        backgroundLogger.debug('final storage', await presets.getValue())
    }
}
