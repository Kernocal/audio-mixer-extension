import type { Preset, PresetProperties } from 'lib/types'
import { storage } from '#imports'

const DEFAULT_PRESETS: Preset[] = [
    { name: 'ui.presets.default', user: false, properties: { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 0.01, reverbWet: 0 } },
    { name: 'ui.presets.classicNightcore', user: false, properties: { playbackRate: 1.25, pitch: 3, pitchWet: 1, reverbDecay: 0.01, reverbWet: 0 } },
    { name: 'ui.presets.slowedReverb', user: false, properties: { playbackRate: 0.75, pitch: 0, pitchWet: 0, reverbDecay: 1, reverbWet: 0.7 } },
    { name: 'ui.presets.roomyReverb', user: false, properties: { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 1.5, reverbWet: 0.8 } },
]

export const DEFAULT_PROPERTIES: Required<PresetProperties> = {
    playbackRate: 1,
    pitch: 0,
    pitchWet: 0,
    reverbDecay: 0.01,
    reverbWet: 0,
    volume: 0.06767,
}

const DEFAULT_SETTINGS = {
    animatePopup: true,
    includeVolume: false,
    knobStyle: '/knobs/SmallLedKnob2.png',
}

export const volume = storage.defineItem<number>('session:volume', { fallback: DEFAULT_PROPERTIES.volume })
export const playbackRate = storage.defineItem<number>('session:playbackRate', { fallback: DEFAULT_PROPERTIES.playbackRate })
export const pitch = storage.defineItem<number>('session:pitch', { fallback: DEFAULT_PROPERTIES.pitch })
export const pitchWet = storage.defineItem<number>('session:pitchWet', { fallback: DEFAULT_PROPERTIES.pitchWet })
export const reverbDecay = storage.defineItem<number>('session:reverbDecay', { fallback: DEFAULT_PROPERTIES.reverbDecay })
export const reverbWet = storage.defineItem<number>('session:reverbWet', { fallback: DEFAULT_PROPERTIES.reverbWet })

export const presets = storage.defineItem<Preset[]>('local:presets', { fallback: DEFAULT_PRESETS })
export const togglePlayback = storage.defineItem<boolean>('session:togglePlayback', { fallback: false })
// settings
export const animatePopup = storage.defineItem<boolean>('local:animatePopup', { fallback: DEFAULT_SETTINGS.animatePopup })
export const includeVolume = storage.defineItem<boolean>('local:includeVolume', { fallback: DEFAULT_SETTINGS.includeVolume })
export const defaultVolume = storage.defineItem<number>('local:defaultVolume', { fallback: DEFAULT_PROPERTIES.volume })
export const knobStyle = storage.defineItem<string>('local:knobStyle', { fallback: DEFAULT_SETTINGS.knobStyle })

// background
// default of 0 may break stuff gl
export const contentTabId = storage.defineItem<number>('session:contentTabId', { fallback: 0 })
export const contentTabUrl = storage.defineItem<string>('session:contentTabUrl', { fallback: '' })
export const installDate = storage.defineItem<string>('local:installDate', { fallback: '' })
export const pageChange = storage.defineItem<boolean>('session:pageChange', { fallback: false })

// content
export const contentExecuted = storage.defineItem<boolean>('session:contentExecuted', { fallback: false })
