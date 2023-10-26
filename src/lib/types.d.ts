type chromeKey = string | string[] | { [key: string]: any } | null;
export type key = string;
export type properties = {
    pitch: number, 
    pitchWet: number, 
    reverbDecay: number, 
    reverbWet: number, 
    volume: number, 
    playbackRate: number
}

interface command {
    result?: true|false;
    message?: string;
    type?: "play"|"pause"|"pitch"|"pitchWet"|"reverbDecay"|"reverbWet"|"volume"|"playbackRate";
    value?: number;
}

export interface Commands {
    [key: string]: command
}

// {START_MIXER: {message: "Starting."}},
// {END_MIXER: {message: "Quitting."}},
// {GET_VALUE: {name: "properties()type", result: "true|false"}},
// {SET_VALUE: {name: "properties()type", value: 0, message: "Updating properties()type."}},
// {TOGGLE_PLAYBACK: {name: "play|pause", message: "Play|Pause."}},