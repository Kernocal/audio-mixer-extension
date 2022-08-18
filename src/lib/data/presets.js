export let presets = [
    {
        name: "Default",
        values: {
            playbackRate: 1,
            pitch: 0,
            pitchWet: 0,
            reverbDecay: 0.01,
            reverbWet: 0
        }, 
    },
    {
        name: "Classic Nightcore",
        values: {
            playbackRate: 1.25,
            pitch: 3,
            pitchWet: 1,
            reverbDecay: 0.01,
            reverbWet: 0
        },
    },
    {
        name: "(slowed + reverb)",
        values: {
            playbackRate: 0.75,
            pitch: 0,
            pitchWet: 0,
            reverbDecay: 1,
            reverbWet: 0.7
        }
    },
    {
        name: "osu Nightcore",
        values: {
            playbackRate: 1.5,
            pitch: 4,
            pitchWet: 1,
            reverbDecay: 0.01,
            reverbWet: 0
        }
    },
    {
        name: "osu Daycore",
        values: {
            playbackRate: 0.75,
            pitch: -3,
            pitchWet: 1,
            reverbDecay: 0.01,
            reverbWet: 0
        }
    },
    {
        name: "Favorite Reverb",
        values: {
            playbackRate: 1,
            pitch: 0,
            pitchWet: 0,
            reverbDecay: 1.5,
            reverbWet: 0.8
        }
    },
    {
        name: "Custom",
        values: {}
    }
];