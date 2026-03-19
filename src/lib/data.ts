import type { Preset, PresetProperties } from './types'

export const ERROR_VOLUME = 0.6767676767
export const ERROR_PLAYBACK_RATE = 1

function genPreset(name: string, user: boolean, properties: PresetProperties) {
    return { name, user, properties }
}

export const DEFAULT_PRESETS: Preset[] = [
    genPreset('Default/Reset', false, { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 0.01, reverbWet: 0 }),
    genPreset('Classic Nightcore', false, { playbackRate: 1.25, pitch: 3, pitchWet: 1, reverbDecay: 0.01, reverbWet: 0 }),
    genPreset('(slowed + reverb)', false, { playbackRate: 0.75, pitch: 0, pitchWet: 0, reverbDecay: 1, reverbWet: 0.7 }),
    genPreset('Roomy Reverb', false, { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 1.5, reverbWet: 0.8 }),
]
