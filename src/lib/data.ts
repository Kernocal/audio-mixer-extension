import type { Commands } from './types';

function genProperties(playbackRate, pitch, pitchWet, reverbDecay, reverbWet) {
    return {playbackRate, pitch, pitchWet, reverbDecay, reverbWet}
};

export const commands: Commands = {
    START_MIXER: {message: "Starting."},
    END_MIXER: {message: "Quitting."},
    GET_VALUE: {},
    SET_VALUE: {},
    TOGGLE_PLAYBACK: {},
}

export let presets = [
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
        name: "Favorite Reverb",
        values: genProperties(1, 0, 0, 1.5, 0.8)
        },
    {
        name: "Custom",
        values: {}
    }
];