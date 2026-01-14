export default defineContentScript({
    matches: [
        '*://soundcloud.com/*',
        '*://open.spotify.com/*',
    ],
    world: 'MAIN',
    runAt: 'document_start',
    main() {
        const EVENT_PREFIX = 'AUDIO_MIXER_'
        let myMedia: any = null
        let volume: number
        let myPlaybackRate: number

        function log(...args: any[]) {
            console.log('Audio Mixer INJECT:', ...args)
        }

        function createEvent(name: string, callback: EventListener) {
            const eventName = EVENT_PREFIX + name
            document.addEventListener(eventName, callback)
        }

        function setValue(type: string, value: any) {
            if (myMedia) {
                myMedia[type] = value
            }
        }

        function getMedia(media: any, pageChange = false) {
            if (myMedia && !myMedia.isSameNode(media)) {
                log('Different media playing.')
            }
            if (myMedia || pageChange) {
                myMedia = media
                myMedia.volume = volume
                myMedia.myPlaybackRate = myPlaybackRate
            }
            else {
                myMedia = media
                volume = myMedia.volume
                myPlaybackRate = myMedia.myPlaybackRate
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
            getMedia(this)
            return originalPlay.apply(this, args as any)
        }

        createEvent('GET_VALUE', (e: any) => {
            if (!myMedia) {
                return
            }
            const resObj = { detail: { type: e.detail.type, value: 0 } as any }
            if (e.detail.type === 'playbackRate') {
                resObj.detail.value = myMedia.myPlaybackRate
            }
            else {
                resObj.detail.value = myMedia[e.detail.type]
            }
            document.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}GIVE_VALUE`, resObj))
        })

        createEvent('SET_VALUE', (e: any) => {
            switch (e.detail.type) {
                case 'volume':
                    volume = e.detail.value
                    setValue('volume', volume)
                    break
                case 'playbackRate':
                    myPlaybackRate = e.detail.value
                    setValue('myPlaybackRate', myPlaybackRate)
                    break
                default:
                    console.warn('Audio Mixer INJECT: SET_VALUE property is unknown/unexpected.', e.detail.type)
            }
        })

        createEvent('PAGE_CHANGE', (_e: any) => {
            HTMLMediaElement.prototype.play = function (this: any, ...args: any[]) {
                getMedia(this, true)
                return originalPlay.apply(this, args as any)
            }
        })

        createEvent('TOGGLE_PLAYBACK', (_e: any) => {
            if (myMedia) {
                myMedia.paused ? myMedia.play() : myMedia.pause()
            }
        })
    },
})
