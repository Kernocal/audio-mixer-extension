import type { Preset } from './types';

function genProperties(playbackRate: number, pitch: number, pitchWet: number, reverbDecay: number, reverbWet: number) {
    return {playbackRate, pitch, pitchWet, reverbDecay, reverbWet}
};

export enum messages {
    STATUS_WAITING = "Waiting for media.",
    STATUS_PLAYING = "Playing.",
    STATUS_TOGGLE_PLAYBACK = "Played/paused.",
    STATUS_ALREADY_PLAYING = "Already playing.",
    STATUS_FAILED_COMMAND = "Failed, check devtools.",
    STATUS_EXIT = "Exiting now.",
    STATUS_QUIT = "Quit connection.",
    STATUS_NO_AUDIO_CONTENT = "No audio detected on current tab. You must play audio before opening the extension.",
    STATUS_RECORD_FAILED = "Error: unable to create and record from tab, check devtools.",
    CONTENT_EXECUTED = "Audio Mixer CONTENT: executed.",
    NO_MEDIA = "Error: no media found, despite the content tab playing audio.",
    NO_MEDIA_PLAYING = "Error: no playing media found.",
    CAPTURE_ERROR = "Error: record tab isn't playing audio but content tab is.",
    CAPTURE_TAB_ERROR = "Error: Unable to capture tab.",
    CONTENT_MULTIPLE = "Error: multiple media elements playing, unable to pick one.",
    QUERY_MULTIPLE = "Error: expected one element but got many, check query",
    QUERY_NONE = "Error: expected one element but got none, check query",
    QUERY_UNABLE_SET_ATTRIBUTE = "Error: unable to set attribute",
    CREATE_TAB = "Error: unable to create record tab.",
    GET_TAB = "Error: tab does not exist.",
    REMOVE_TAB = "Error: unable to remove tab.",
    SET_VALUE = "Error: unable to set value",
    COMMAND_FAILED = "Error: unable to send command",
    EXITING = "Exiting, closed tabs, cleared storage and reset playback rate.",
    GITHUB_ISSUE = "Please open an issue on GitHub with any details you have.",
    GITHUB_WEBSITE = "If this website is already supported please open an issue on GitHub, if it isn't supported yet feel free to message me or open an issue on GitHub."
}

export const presets: Preset[] = [
    {
        name: "Default/Reset",
        values: genProperties(1, 0, 0, 0.01, 0)
        }, 
    {
        name: "Classic Nightcore",
        values: genProperties(1.25, 3, 1, 0.01, 0)
        },
    {
        name: "(slowed + reverb)",
        values: genProperties(0.75, 0, 0, 1, 0.7)
        },
    {
        name: "osu Nightcore",
        values: genProperties(1.5, 4, 1, 0.01, 0)
        },
    {
        name: "osu Daycore",
        values: genProperties(0.75, -3, 1, 0.01, 0)
        },
    {
        name: "Favourite Reverb",
        values: genProperties(1, 0, 0, 1.5, 0.8)
        },
    {
        name: "Custom",
        values: {}
    }
];