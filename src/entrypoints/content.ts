import type { ContentProperty, CustomMedia, NullMedia, PropertyValue } from 'lib/types'
import { storage } from '#imports'
import { MESSAGES } from 'lib/data'
import { getInjectedValue, INJECT_WEBSITE, sendEvent, setInjectedValue, updateSlider } from 'lib/util/siteSpecific'

let myMedia: NullMedia = null

async function getValue(type: ContentProperty) {
    if (!INJECT_WEBSITE && myMedia) {
        const storedValue = await storage.getItem<number>(`session:${type}`)
        const mediaValue = myMedia[type]
        if (storedValue !== mediaValue) {
            console.warn(`Out of sync ${type}: stored ${storedValue},  media ${mediaValue}`)
            await storage.setItem(`session:${type}`, mediaValue)
            return mediaValue
        }
        else {
            return storedValue
        }
    }
    else {
        const value = await getInjectedValue(type)
        await storage.setItem(`session:${type}`, value)
        return value
    }
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

async function setMediaValues(volume: number, playbackRate: number) {
    await setValue('volume', volume)
    await setValue('playbackRate', playbackRate)
}

async function setupInjected() {
    const pageChange = await storage.getItem<boolean>('session:pageChange')
    if (!pageChange) {
        const volume = await getValue('volume')
        const playbackRate = await getValue('playbackRate')
        await setMediaValues(volume, playbackRate)
    }
    await storage.setItem('session:pageChange', false)
}

function getPlayingMedia(mediaElements: CustomMedia[]) {
    const mediaPlaying = Object.values(mediaElements).filter(element => element.playing)
    if (mediaPlaying.length === 1) {
        return mediaPlaying[0]
    }
    else if (mediaPlaying.length > 1) {
        // todo: Let user pick which media if many playing.
        console.warn(MESSAGES.CONTENT_MULTIPLE, mediaPlaying)
        return mediaPlaying[0]
    }
    console.warn(MESSAGES.NO_MEDIA_PLAYING, mediaPlaying)
    return null
}

function getMedia(): NullMedia {
    // @ts-expect-error: mediaElements should always have playing attribute in this context space.
    const mediaElements: CustomMedia[] = document.querySelectorAll('audio, video')
    if (mediaElements.length === 1) {
        return mediaElements[0]
    }
    else if (mediaElements.length > 1) {
        return getPlayingMedia(mediaElements)
    }
    console.warn(MESSAGES.NO_MEDIA, MESSAGES.GITHUB_WEBSITE)
    return null
}

function init() {
    console.log(MESSAGES.CONTENT_EXECUTED)

    const dummyElement = document.createElement('audio')
    if (!('playing' in dummyElement)) {
        // Media elements do not have a native playing attribute, create attribute using media properties.
        Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
            get() {
                return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2)
            },
        })
    }

    if (!(myMedia instanceof HTMLMediaElement)) {
        if (!INJECT_WEBSITE) {
            myMedia = getMedia()
            if (myMedia) {
                console.log(`current playbackRate ${myMedia.playbackRate} current volume ${myMedia.volume}`)

                storage.setItem('session:volume', myMedia.volume)
                storage.setItem('session:playbackRate', myMedia.playbackRate)
            }
        }
        else {
            setupInjected()
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const { target, command, data } = request
        console.log('CONTENT message: ', target, command, data)
        if (command === 'PING') {
            sendResponse({ message: 'PONG' })
            return true
        }
        if (data.property === 'volume' || data.property === 'playbackRate') {
            if (command === 'GET_VALUE') {
                console.log('CONTENT GET_VALUE: ', data.property)
                getValue(data.property).then((value) => {
                    sendResponse({ message: 'success', property: data.property, value })
                })
                return true
            }
            if (command === 'SET_VALUE') {
                setValue(data.property, data.value).then(() => {
                    sendResponse({ message: 'success' })
                })
                return true
            }
        }
        if (command === 'TOGGLE_PLAYBACK') {
            if (!INJECT_WEBSITE && myMedia) {
                myMedia.paused ? myMedia.play() : myMedia.pause()
            }
            else {
                sendEvent('TOGGLE_PLAYBACK')
            }
            sendResponse({ message: 'success' })
            return true
        }
        if (command === 'PAGE_CHANGE') {
            const { volume, playbackRate } = data
            if (!INJECT_WEBSITE) {
                myMedia?.addEventListener('timeupdate', () => {
                    console.log('CONTENT: PLAYING NAOW setting vol', volume, 'playbackRate', playbackRate)
                    setMediaValues(volume, playbackRate)
                }, { once: true })
            }
            else {
                setMediaValues(volume, playbackRate)
                sendEvent('PAGE_CHANGE')
            }
            sendResponse({ message: 'success' })
            return true
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
                storage.setItem('session:contentExecuted', true)
            }
        })
    },
})
