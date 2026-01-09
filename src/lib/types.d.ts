export type ContentProperty = 'volume' | 'playbackRate'
export type ToneProperty = 'pitch' | 'pitchWet' | 'reverbDecay' | 'reverbWet'
export type Property = ContentProperty | ToneProperty
export type PropertyValue = number

export interface OptionalProperties {
    volume?: number
    playbackRate?: number
    pitch?: number
    pitchWet?: number
    reverbDecay?: number
    reverbWet?: number
}
export interface PresetProperties {
    playbackRate: number
    pitch: number
    pitchWet: number
    reverbDecay: number
    reverbWet: number
}
export type PropertiesNoVolume = PresetProperties
export type Properties = PresetProperties & {
    volume: number
}
export interface Preset {
    name: string
    values: PresetProperties | object
}
export type StartMixerResponse = Properties & {
    message?: string
}
export interface AnyResponse {
    [key: string]: string | number
}

export interface CustomEventData {
    detail?: {
        type: Property
        value?: PropertyValue
    }
}
export type GiveValueEvent = Event & {
    detail: {
        type: Property
        value: PropertyValue
    }
}

interface PopUpCommand {
    command: 'SET_VALUE' | 'TOGGLE_PLAYBACK' | 'EXIT_MIXER'
}
export type PopUpCommands = PopUpCommand | {
    popUpCommand
    type: Property
    value: number
}
export interface PageChange {
    command: 'PAGE_CHANGE'
    volume: number
    playbackRate: number
}
export type ContentCommand = PageChange | {
    command: 'GET_VALUE' | 'SET_VALUE' | 'TOGGLE_PLAYBACK' | 'PING'
    type?: ContentProperty
    value?: number
}

interface Custom {
    playing: boolean
};
type MediaElement = HTMLAudioElement | HTMLVideoElement
export type MediaElements = MediaElement[]
export type NullMedia = MediaElement | null
export type CustomMedia = (HTMLAudioElement & Custom)|(HTMLVideoElement & Custom)
