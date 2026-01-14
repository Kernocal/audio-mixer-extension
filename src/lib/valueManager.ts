import type { Properties } from 'lib/messaging/communication'
import { ERROR_PLAYBACK_RATE, ERROR_VOLUME } from './data'
import { miscLogger } from './logger'

type STORAGE_AREAS = 'session' | 'local'

async function getSafeValue(area: STORAGE_AREAS, key: string, defaultValue: number) {
    const value = await storage.getItem<number>(`${area}:${key}`)
    if (!value) {
        miscLogger.warn(`Expected storage of ${area}:${key} but empty, using default ${defaultValue}`)
        return defaultValue
    }
    return value
}

export function emptyPropeties(): Record<Properties, number> {
    return {
        pitch: 0,
        pitchWet: 0,
        reverbDecay: 0.01,
        reverbWet: 0,
        volume: ERROR_VOLUME,
        playbackRate: ERROR_PLAYBACK_RATE,
    }
}

export async function getProperty(property: Properties) {
    return await getSafeValue('session', property, emptyPropeties()[property])
}

export async function setProperty(property: Properties, value: number) {
    await storage.setItem(`session:${property}`, value)
}
