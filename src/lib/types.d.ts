export type ContentProperty = "volume"|"playbackRate";
export type ToneProperty = "pitch"|"pitchWet"|"reverbDecay"|"reverbWet";
export type Property = ContentProperty|ToneProperty;
export type PropertyValue = number;

export type OptionalProperties = {
    volume?: number,
    playbackRate?: number,
    pitch?: number, 
    pitchWet?: number, 
    reverbDecay?: number, 
    reverbWet?: number
};

export type PresetProperties = {
    playbackRate: number,
    pitch: number, 
    pitchWet: number, 
    reverbDecay: number, 
    reverbWet: number
};
export type Preset = {
    name: string,
    values: PresetProperties|{}
};
export type PropertiesNoVolume = PresetProperties;
export type Properties = PresetProperties & {
    volume: number
};

export type StartMixerResponse = Properties & {
    message?: string
}

type GetValueEvent = Event & {
    detail: {
        type: Property
    }
};
type SetValueEvent = Event & {
    detail: {
        type: Property,
        value: PropertyValue
    }
};
export type GiveValueEvent = SetValueEvent;

interface PopUpCommand {
    command: "SET_VALUE"|"TOGGLE_PLAYBACK"|"EXIT_MIXER"
}
export type PopUpCommands = PopUpCommand|{
    popUpCommand,
    type: Property,
    value: number
}
export type ContentCommand = {
    command: "GET_VALUE"|"SET_VALUE"|"TOGGLE_PLAYBACK"|"PAGE_CHANGE",
    type?: ContentProperty,
    value?: number
};

interface Custom {
    playing: boolean
};
export type Media = HTMLAudioElement|HTMLVideoElement|null;
export type CustomMedia = (HTMLAudioElement & Custom)|(HTMLVideoElement & Custom);

export type Response = {
    [key: string]: string|number
};


// export type Pitch = {
//     pitch: number,
//     wet: {value: number}
// };
// export type __Reverb = {
//     decay: Time,
//     preDelay: Time,
//     wet: {value: number}
// }
// type chromeKey = string | string[] | { [key: string]: any } | null;

// interface command {
//     result?: true|false;
//     message?: string;
//     type?: type;
//     value?: number;
// }

// interface Commands {
//     [key: string]: command
// }