import type { ContentProperty, MediaElement, NullMedia, PropertyValue } from 'lib/types'
import { storage } from '#imports'
import { MESSAGES } from 'lib/data'
import { contentLogger, injectLogger } from 'lib/logger'
import { getInjectedValue, INJECT_URLS, sendInjectEvent, setInjectedValue, updateSlider } from 'lib/util/siteSpecific'
import { getProperty, watchItem } from 'lib/valueManager'

let myMedia: NullMedia = null
let INJECT_WEBSITE = false

function isPlaying(element: HTMLMediaElement): boolean {
    return !!(element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2)
}

function injectWebsite() {
    INJECT_WEBSITE = INJECT_URLS.some((url) => {
        return window.location.host.includes(url)
    })
}

async function setValue(type: ContentProperty, value: PropertyValue) {
    if (!INJECT_WEBSITE && myMedia) {
        myMedia[type] = value
    }
    else {
        setInjectedValue(type, value)
    }
    await storage.setItem(`session:${type}`, value)
    if (type === 'volume') {
        updateSlider(value)
    }
}

function getMedia(): MediaElement {
    const mediaElements: MediaElement[] = [...document.querySelectorAll<HTMLAudioElement | HTMLVideoElement>('audio, video')]
    const mediaPlaying = mediaElements.filter(isPlaying)
    if (mediaPlaying.length === 0) {
        contentLogger.error(MESSAGES.NO_MEDIA, MESSAGES.GITHUB_WEBSITE)
        throw new Error(`${MESSAGES.NO_MEDIA} ${MESSAGES.GITHUB_WEBSITE}`)
    }
    return mediaPlaying[0]
}

function setupContent() {
    myMedia = getMedia()
    contentLogger.debug(`Current playbackRate ${myMedia.playbackRate} current volume ${myMedia.volume} current media ${myMedia}`)

    storage.setItem('session:volume', myMedia.volume)
    storage.setItem('session:playbackRate', myMedia.playbackRate)
    // debug
    storage.getItem('session:volume').then((volume) => {
        contentLogger.debug('volume in storage', volume)
    })
    storage.getItem('session:playbackRate').then((playbackRate) => {
        contentLogger.debug('playbackRate in storage', playbackRate)
    })
}

async function setupInjected() {
    const pageChange = await storage.getItem<boolean>('session:pageChange')
    if (!pageChange) {
        await setValue('volume', await getProperty('volume'))
        await setValue('playbackRate', await getProperty('playbackRate'))
    }
    await storage.setItem('session:pageChange', false)
}

function init() {
    contentLogger.info(MESSAGES.CONTENT_EXECUTED)
    document.addEventListener('AUDIO_MIXER_LOG', (event: any) => {
        injectLogger.debug(event.detail)
    })

    injectWebsite()
    if (INJECT_WEBSITE) {
        setupInjected()
    }
    else {
        setupContent()
    }

    watchItem('volume', (value) => {
        contentLogger.debug('new volume in storage', value)
        if (value !== null) {
            if (!INJECT_WEBSITE && myMedia) {
                myMedia.volume = value
            }
            else {
                setInjectedValue('volume', value)
            }
        }
    })

    watchItem('playbackRate', (value) => {
        contentLogger.debug('new playbackRate in storage', value)
        if (value !== null) {
            if (!INJECT_WEBSITE && myMedia) {
                myMedia.playbackRate = value
            }
            else {
                setInjectedValue('playbackRate', value)
            }
        }
    })

    watchItem('pageChange', async (isChanging) => {
        contentLogger.debug('new pageChange in storage', isChanging)
        if (isChanging) {
            const volume = await getProperty('volume')
            const playbackRate = await getProperty('playbackRate')

            if (!INJECT_WEBSITE && myMedia) {
                myMedia?.addEventListener('timeupdate', () => {
                    if (myMedia) {
                        myMedia.volume = volume
                        myMedia.playbackRate = playbackRate
                    }
                }, { once: true })
            }
            else {
                setInjectedValue('volume', volume)
                setInjectedValue('playbackRate', playbackRate)
                sendInjectEvent('PAGE_CHANGE')
            }
            await storage.setItem('session:pageChange', false)
        }
    })

    watchItem('session:togglePlayback', (value) => {
        if (value) {
            if (!INJECT_WEBSITE && myMedia) {
                myMedia.paused ? myMedia.play() : myMedia.pause()
            }
            else {
                sendInjectEvent('TOGGLE_PLAYBACK')
            }
            storage.setItem('session:togglePlayback', false)
        }
    })
}

export default defineContentScript({
    registration: 'runtime',
    // matches: ['<all_urls>'],
    main(ctx) {
        storage.getItem<boolean>('session:contentExecuted').then((executed) => {
            if (!executed || executed === undefined) {
                init()
                // need to set false when page changes
                storage.setItem('session:contentExecuted', true)
            }
        })
    },
})
