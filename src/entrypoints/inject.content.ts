import { websiteMessenger } from 'lib/messaging/customEvent'

type CustomMediaElement = HTMLMediaElement & {
    playing: boolean
    myPlaybackRate: number
}

export default defineContentScript({
    matches: [
        '*://soundcloud.com/*',
        '*://open.spotify.com/*',
    ],
    world: 'MAIN',
    runAt: 'document_start',
    main() {
        let mediaElement: CustomMediaElement | null = null
        let volume: number = 0.06767
        let myPlaybackRate: number = 1

        function log(...args: any[]) {
            websiteMessenger.sendMessage('log', args.join(' '))
        }

        function setMedia(media: CustomMediaElement, pageChange = false) {
            // wat was this
            // if (mediaElement && !mediaElement.isSameNode(media)) {
            //     log('Different media playing to original one stored.')
            // }
            if (mediaElement || pageChange) {
                mediaElement = media
                mediaElement.volume = volume
                mediaElement.myPlaybackRate = myPlaybackRate
            }
            else {
                mediaElement = media
                volume = mediaElement.volume
                myPlaybackRate = mediaElement.myPlaybackRate
            }
        }

        log('running.')

        // Define 'playing' property on HTMLMediaElement
        Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
            get() {
                return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2)
            },
            configurable: true,
        })

        const originalPlaybackRate = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')
        if (originalPlaybackRate) {
            // don't let the page change the playback rate
            Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
                get: originalPlaybackRate.get,
                set() {},
                configurable: true,
            })

            Object.defineProperty(HTMLMediaElement.prototype, 'myPlaybackRate', {
                get: originalPlaybackRate.get,
                set: originalPlaybackRate.set,
                configurable: true,
            })
        }

        const originalPlay = HTMLMediaElement.prototype.play
        HTMLMediaElement.prototype.play = function (this: any, ...args: any[]) {
            setMedia(this)
            return originalPlay.apply(this, args as any)
        }

        websiteMessenger.onMessage('getValue', ({ data }) => {
            const { property } = data
            if (!mediaElement) {
                log('getValue: myMedia is null')
                return { property, value: 0 }
            }
            switch (property) {
                case 'playbackRate':
                    return { property, value: myPlaybackRate }
                default:
                    return { property, value: mediaElement[property] }
            }
        })

        websiteMessenger.onMessage('setValue', ({ data }) => {
            const { property, value } = data
            if (!mediaElement) {
                log('setValue: myMedia is null')
                return
            }
            switch (property) {
                case 'playbackRate':
                    myPlaybackRate = value
                    mediaElement.myPlaybackRate = myPlaybackRate
                    break
                case 'volume':
                    volume = value
                    mediaElement.volume = volume
                    break
                default:
                    log('setValue property is unknown/unexpected')
            }
        })

        websiteMessenger.onMessage('pageChange', () => {
            // rethink this
            HTMLMediaElement.prototype.play = function (this: any, ...args: any[]) {
                setMedia(this, true)
                return originalPlay.apply(this, args as any)
            }
        })

        websiteMessenger.onMessage('togglePlayback', () => {
            if (mediaElement) {
                mediaElement.paused ? mediaElement.play() : mediaElement.pause()
            }
        })
    },
})
