export type MediaProperty = 'volume' | 'playbackRate'
export type ToneProperty = 'pitch' | 'pitchWet' | 'reverbDecay' | 'reverbWet'

export interface PropertyPayload<T> {
    property: T
    value: number
}

export interface PresetProperties {
    playbackRate: number
    pitch: number
    pitchWet: number
    reverbDecay: number
    reverbWet: number
    volume?: number
}

export interface Preset {
    name: string
    user: boolean
    properties: PresetProperties
}
