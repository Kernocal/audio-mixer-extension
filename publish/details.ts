import type { PublishDetails } from './types'

// The actual icon size should be 96x96 (for square icons); an additional 16 pixels per side should be transparent padding, adding up to 128x128 total image size. For details, see Icon size.
// The image must be in PNG format.
// The image should work well on both light and dark backgrounds.
// When you design the icon, keep the following advice in mind:

// Don't put an edge around the 128x128 image; the UI might add edges.
// If your icon is mostly dark, consider adding a subtle white outer glow so it'll look good against dark backgrounds.
// Avoid large drop shadows; the UI might add shadows. It's OK to use small shadows for contrast.
// If you have a bevel at the bottom of your icon, we recommend 4 pixels of depth.
// Make the icon face the viewer, rather than having built-in perspective. See Perspective for details.

const description = { data:
`FOSS Music Mixer applies presets to audio on most websites such as Spotify, SoundCloud, and YouTube.
The presets were built around Nightcore but have expanded to include reverb. 
You can also create custom presets with whatever values you want.

Features:
- Pitch shifting with semitone control
- Reverb with adjustable decay
- Playback rate control
- Save and load custom presets

Zero data collection.
Source on GitHub at github.com/Kernocal/audio-mixer-extension` }

export const details = {
    common: {
        description: description.data,
        privacyPolicyUrl: 'https://github.com/kernocal/audio-mixer-extension/blob/main/PRIVACY.md',
        screenshots: [
            { path: 'publish/assets/1g1280x800.png', width: 1280, height: 800 },
            { path: 'publish/assets/2g1280x800.png', width: 1280, height: 800 },
            { path: 'publish/assets/3g1280x800.png', width: 1280, height: 800 },
        ],
        smallPromoTile: { path: 'publish/assets/small-tile-440x280.png', width: 440, height: 280 },
        largePromoTile: null,
        promoVideoUrl: null,
        websiteUrl: 'https://github.com/kernocal/audio-mixer-extension',
        matureContent: false,
    },
    chrome: {
        category: 'Entertainment',
        icon: { path: 'publish/assets/chrome-128.png', width: 128, height: 128 },
        officialUrl: null,
        supportUrl: 'https://github.com/kernocal/audio-mixer-extension/issues',
        singlePurpose: 'Modifies audio output locally.',
        permissionJustifications: {
            activeTab: 'apply audio effects to media on the active page.',
            scripting: 'detect and interact with media elements (audio/video) on the active page.',
            storage: 'saves user presets and extension settings locally.',
            tabCapture: 'get audio stream to apply audio effects.',
            tabs: 'queries tab information to work across navigation.',
            webNavigation: 'detects page navigations to properly clean up and re-initialize mixing.',
            offscreen: 'run the Web Audio API and navigator.mediaDevices.getUserMedia (required since service workers cannot access Web Audio).',
        },
        hostPermissionJustification: 'sites need an injected script into MAIN world to mix the audio at document_start, activeTab is too late.',
        remoteCode: false,
    },
    edge: {
        category: 'Entertainment',
        icon: { path: 'publish/assets/edge-300.png', width: 300, height: 300 },
        searchTerms: ['music mixer', 'music', 'mixer', 'audio', 'audio mixer', 'nightcore', 'reverb'],
        supportContact: 'https://github.com/kernocal/audio-mixer-extension/issues',
        collectsPersonalData: false,
    },
} satisfies PublishDetails
