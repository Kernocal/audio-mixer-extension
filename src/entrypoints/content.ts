import type { MediaProperty } from 'lib/types'
import { i18n } from '#i18n'
import { contentLogger, injectLogger } from 'lib/logger'
import { sendMessage } from 'lib/messaging'
import { websiteMessenger } from 'lib/messaging/customEvent'
import { contentExecuted, pageChange, playbackRate, togglePlayback, volume } from 'lib/storage/items'

let myMedia: HTMLMediaElement | null = null
let INJECT_WEBSITE = false

function isPlaying(element: HTMLMediaElement): boolean {
    return !!(element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2)
}

function applyToMedia(property: MediaProperty, value: number) {
    if (!INJECT_WEBSITE && myMedia) {
        myMedia[property] = value
    }
    else {
        websiteMessenger.sendMessage('setValue', { property, value })
    }
}

function getMedia(): HTMLMediaElement {
    const mediaElements: HTMLMediaElement[] = [...document.querySelectorAll<HTMLAudioElement | HTMLVideoElement>('audio, video')]
    const mediaPlaying = mediaElements.filter(isPlaying)
    if (mediaPlaying.length === 0) {
        contentLogger.error(i18n.t('errors.content.noMedia'), i18n.t('messages.github.website'))
        throw new Error(`${i18n.t('errors.content.noMedia')} ${i18n.t('messages.github.website')}`)
    }
    return mediaPlaying[0]
}

async function setupContent() {
    myMedia = getMedia()
    contentLogger.debug(`Current playbackRate ${myMedia.playbackRate} current volume ${myMedia.volume} current media ${myMedia}`)

    const isPageChange = await pageChange.getValue()
    if (isPageChange) {
        myMedia.volume = await volume.getValue()
        myMedia.playbackRate = await playbackRate.getValue()
        await pageChange.setValue(false)
    }
    else {
        await volume.setValue(myMedia.volume)
        await playbackRate.setValue(myMedia.playbackRate)
    }
    // debug
    contentLogger.debug('volume in storage', await volume.getValue())
    contentLogger.debug('playbackRate in storage', await playbackRate.getValue())
}

async function setupInjected() {
    const isPageChange = await pageChange.getValue()
    if (!isPageChange) {
        applyToMedia('volume', await volume.getValue())
        applyToMedia('playbackRate', await playbackRate.getValue())
    }
    await pageChange.setValue(false)
}

function init() {
    contentLogger.info(i18n.t('errors.content.executed'))
    websiteMessenger.onMessage('log', ({ data }) => {
        injectLogger.debug(data)
    })

    // should probably move/infer from manifest
    INJECT_WEBSITE = ['soundcloud.com', 'open.spotify.com'].some((url) => {
        return window.location.host.includes(url)
    })
    if (INJECT_WEBSITE) {
        setupInjected()
    }
    else {
        setupContent()
    }

    volume.watch(value => applyToMedia('volume', value))
    playbackRate.watch(value => applyToMedia('playbackRate', value))

    pageChange.watch(async (isChanging) => {
        contentLogger.debug('new pageChange in storage', isChanging)
        if (isChanging) {
            const volumeValue = await volume.getValue()
            const playbackRateValue = await playbackRate.getValue()

            if (!INJECT_WEBSITE) {
                try {
                    myMedia = getMedia()
                }
                catch {
                    contentLogger.warn('No media found after page change')
                }
                if (myMedia) {
                    myMedia.volume = volumeValue
                    myMedia.playbackRate = playbackRateValue
                }
            }
            else {
                websiteMessenger.sendMessage('setValue', { property: 'volume', value: volumeValue })
                websiteMessenger.sendMessage('setValue', { property: 'playbackRate', value: playbackRateValue })
                websiteMessenger.sendMessage('pageChange')
            }
            await pageChange.setValue(false)
        }
    })

    togglePlayback.watch((value) => {
        if (value) {
            if (!INJECT_WEBSITE && myMedia) {
                myMedia.paused ? myMedia.play() : myMedia.pause()
            }
            else {
                websiteMessenger.sendMessage('togglePlayback')
            }
            togglePlayback.setValue(false)
        }
    })
}

export default defineContentScript({
    registration: 'runtime',
    // matches: ['<all_urls>'],
    async main() {
        const executed = await contentExecuted.getValue()
        if (!executed) {
            init()
            sendMessage('contentReady')
            contentExecuted.setValue(true)
        }
    },
})
