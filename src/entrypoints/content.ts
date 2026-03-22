import type { MediaProperty } from 'lib/types'
import { i18n } from '#imports'
import { MatchPattern } from '@webext-core/match-patterns'
import { contentLogger, injectLogger } from 'lib/logger'
import { websiteMessenger } from 'lib/messaging/customEvent'
import { contentExecuted, pageChange, playbackRate, togglePlayback, volume } from 'lib/storage/items'
import script from '~/entrypoints/inject.content'

type MediaAdapter = {
    apply: (property: MediaProperty, value: number) => void
    bind: (reason: 'initial' | 'pageChange') => Promise<void>
    toggle: () => void
}

function isPlaying(element: HTMLMediaElement): boolean {
    return !!(element.currentTime > 0 && !element.paused && !element.ended && element.readyState > 2)
}

async function waitForMedia(signal: AbortSignal): Promise<HTMLMediaElement> {
    for (let i = 0; i < 20 && !signal.aborted; i++) {
        const mediaElements = [...document.querySelectorAll<HTMLMediaElement>('audio, video')]
        const aliveMedia = mediaElements.find(el => isPlaying(el)) ?? mediaElements.find(el => el.isConnected && (el.currentSrc || el.src)) ?? null
        if (aliveMedia) {
            return aliveMedia
        }
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error('No media found')
}

function directAdapter(): MediaAdapter {
    let myMedia: HTMLMediaElement | null = null
    let controller: AbortController | null = null

    return {
        apply(property, value) {
            if (myMedia) {
                myMedia[property] = value
            }
        },

        async bind(reason) {
            controller?.abort()
            controller = new AbortController()

            try {
                myMedia = await waitForMedia(controller.signal)
                contentLogger.debug(`Media bound (${reason})`)
                if (reason === 'pageChange') {
                    myMedia.volume = await volume.getValue()
                    myMedia.playbackRate = await playbackRate.getValue()
                }
                else {
                    await volume.setValue(myMedia.volume)
                    await playbackRate.setValue(myMedia.playbackRate)
                }
            }
            catch {
                contentLogger.error(i18n.t('errors.content.noMedia'))
            }
        },

        toggle() {
            if (myMedia) {
                myMedia.paused ? myMedia.play() : myMedia.pause()
            }
        },
    }
}

function injectedAdapter(): MediaAdapter {
    return {
        apply(property, value) {
            websiteMessenger.sendMessage('setValue', { property, value })
        },

        async bind(reason) {
            if (reason === 'pageChange') {
                this.apply('volume', await volume.getValue())
                this.apply('playbackRate', await playbackRate.getValue())
                websiteMessenger.sendMessage('pageChange')
            }
        },

        toggle() {
            websiteMessenger.sendMessage('togglePlayback')
        },
    }
}

async function init() {
    contentLogger.info(i18n.t('errors.content.executed'))
    websiteMessenger.onMessage('log', ({ data }) => {
        injectLogger.debug(data)
    })

    const injects = Array.isArray(script.matches) ? script.matches : []
    const isInjected = injects.some(url => new MatchPattern(url).includes(window.location))
    const adapter = isInjected ? injectedAdapter() : directAdapter()
    await adapter.bind('initial')
    volume.watch(value => adapter.apply('volume', value))
    playbackRate.watch(value => adapter.apply('playbackRate', value))

    pageChange.watch((isChanging) => {
        if (isChanging) {
            contentLogger.debug('pageChange detected')
            adapter.bind('pageChange')
            pageChange.setValue(false)
        }
    })

    togglePlayback.watch((toggle) => {
        if (toggle) {
            adapter.toggle()
            togglePlayback.setValue(false)
        }
    })
}

export default defineContentScript({
    registration: 'runtime',
    // matches: ['<all_urls>'],
    async main() {
        if (!await contentExecuted.getValue()) {
            await init()
            await contentExecuted.setValue(true)
        }
    },
})
