# Audio Mixer

Audio Mixer is a browser extension that currently works on Chrome and Edge. It allows you to apply audio presets to any website playing audio such as Youtube, Soundcloud, Spotify.

The presets were built around Nightcore but have expanded to includes others such as
1. (slowed + reverb)
2. osu based Nightcore
3. osu based Daycore

Custom values are also supported.

# Building

To build and load the extension from source run:
```
degit Kernocal/audio-mixer-extension <folder-name>
if you don't want git history
or
git clone https://github.com/Kernocal/audio-mixer-extension <folder-name>

cd <folder-name>
npm run build
```
Then you can load unpacked using the created build folder.


# About
The extension is built with Svelte, using SvelteKit with the browser extension adapter.
Windi CSS for styling.
Tone.js for pitch and reverb effects.

# Known Issues
Currently when ran on sites that dynamically create their audio the extension cannot change playback rate or volume, though pitch and reverb changes still work.

# Credits
The [SvelteKit browser extension adapter](https://github.com/antony/sveltekit-adapter-browser-extension) made by antony.  
[Tone.js](https://tonejs.github.io/) for PitchShift and reverb, maintained by tambien.  
The initial [tapCapture model](https://github.com/zhw2590582/chrome-audio-capture) using unique options method that works with manifest v3, by zhw2590582.  