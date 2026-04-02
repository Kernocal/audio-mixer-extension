import { websiteMessenger } from 'lib/messaging/customEvent'
import { scoreMediaElement } from 'lib/util/scriptCommon'

type PlayDescriptor = () => Promise<void>

interface MediaAccessor {
    get: (this: HTMLMediaElement) => number
    set: (this: HTMLMediaElement, value: number) => void
}

interface PrototypeDescriptors {
    playbackRate: MediaAccessor
    volume: MediaAccessor
    play: PlayDescriptor
}

interface State {
    mediaElement: HTMLMediaElement | null
    volume: number
    playbackRate: number
    pendingPageChange: boolean
}

function patchMediaProperty(property: 'playbackRate' | 'volume') {
    const original = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, property)!
    Object.defineProperty(HTMLMediaElement.prototype, property, {
        get: original.get,
        set() {},
        configurable: true,
    })
    return () => Object.defineProperty(HTMLMediaElement.prototype, property, original)
}

function patchMediaPlay(original: PlayDescriptor, onPlay: (el: HTMLMediaElement) => void) {
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement, ...args: unknown[]) {
        onPlay(this)
        return original.apply(this, args as [])
    }
}

function bindMedia(state: State, media: HTMLMediaElement, originals: PrototypeDescriptors) {
    if (state.mediaElement || state.pendingPageChange) {
        state.mediaElement = media
        originals.volume.set.call(media, state.volume)
        originals.playbackRate.set.call(media, state.playbackRate)
        state.pendingPageChange = false
    }
    else {
        state.mediaElement = media
        state.volume = media.volume
        state.playbackRate = media.playbackRate
    }
}

function considerMedia(state: State, candidate: HTMLMediaElement, originals: PrototypeDescriptors) {
    if (!state.mediaElement)
        return bindMedia(state, candidate, originals)
    if (scoreMediaElement(candidate) >= scoreMediaElement(state.mediaElement) + 2)
        return bindMedia(state, candidate, originals)
}

function scanForBetterMedia(state: State, originals: PrototypeDescriptors) {
    const all = [...document.querySelectorAll<HTMLMediaElement>('audio, video')]
    if (!all.length)
        return
    const best = all.reduce((a, b) => scoreMediaElement(a) >= scoreMediaElement(b) ? a : b)
    considerMedia(state, best, originals)
}

function log(...args: string[]) {
    websiteMessenger.sendMessage('log', args.join(' '))
}

export default defineContentScript({
    matches: [
        '*://soundcloud.com/*',
        '*://open.spotify.com/*',
        '*://*.youtube.com/*',
    ],
    world: 'MAIN',
    runAt: 'document_start',
    main() {
        const originals: PrototypeDescriptors = {
            playbackRate: Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate') as MediaAccessor,
            volume: Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume') as MediaAccessor,
            play: HTMLMediaElement.prototype.play,
        }
        const state: State = {
            mediaElement: null,
            volume: 0.06767,
            playbackRate: 1,
            pendingPageChange: false,
        }

        let restorePlaybackRate = () => {}
        let restoreVolume = () => {}

        const scan = () => scanForBetterMedia(state, originals)
        const consider = (el: HTMLMediaElement) => {
            considerMedia(state, el, originals)
            queueMicrotask(scan)
        }

        patchMediaPlay(originals.play, consider)

        websiteMessenger.onMessage('getValue', ({ data }) => {
            return { property: data.property, value: state[data.property] }
        })

        websiteMessenger.onMessage('setValue', ({ data }) => {
            state[data.property] = data.value
            if (!state.mediaElement) {
                log('setValue: myMedia is null, value stored for later')
                return
            }
            originals[data.property].set.call(state.mediaElement, data.value)
        })

        websiteMessenger.onMessage('pageChange', () => {
            state.mediaElement = null
            state.pendingPageChange = true
            // maybe bad
            for (let i = 0; i < 5; i++)
                setTimeout(scan, i * 500)
        })

        websiteMessenger.onMessage('togglePlayback', () => {
            if (state.mediaElement) {
                state.mediaElement.paused ? state.mediaElement.play() : state.mediaElement.pause()
            }
        })

        websiteMessenger.onMessage('setup', () => {
            log('setup: applying prototype patches')
            patchMediaPlay(originals.play, consider)
            restorePlaybackRate = patchMediaProperty('playbackRate')
            restoreVolume = patchMediaProperty('volume')
            scan()
        })

        websiteMessenger.onMessage('teardown', () => {
            log('teardown: restoring original prototypes')
            restorePlaybackRate()
            restoreVolume()
            HTMLMediaElement.prototype.play = originals.play
        })
    },
})
