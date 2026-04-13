import type { Browser } from '#imports'
import type { PresetProperties } from 'lib/types'
import { backgroundLogger } from 'lib/logger'
import { animatePopup, presets } from 'lib/storage/items'

interface OldPreset {
    name: string
    values: PresetProperties
}

async function fixOldPresets() {
    backgroundLogger.debug('we updating, currect storage', await presets.getValue())
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
    await presets.setValue([...presets.fallback, ...convertedPresets])
    backgroundLogger.debug('trying to fix', filteredPresets, 'final storage', await presets.getValue())
}

async function fixAnimation() {
    const old = await browser.storage.local.get('animation')
    if (old.animation !== undefined) {
        backgroundLogger.debug('Migrating animation → animatePopup', old.animation)
        await animatePopup.setValue(old.animation as boolean)
        await browser.storage.local.remove('animation')
    }
}

export async function fixLegacy(details: Browser.runtime.InstalledDetails) {
    if (details.reason === 'update' && details.previousVersion && details.previousVersion < '1.8.0') {
        if (details.previousVersion < '1.5.2') {
            fixOldPresets()
        }
        if (details.previousVersion >= '1.7.0' && details.previousVersion <= '1.8.0') {
            fixAnimation()
        }
    }
}
