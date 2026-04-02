import type { MediaProperty } from 'lib/types'
import { MatchPattern } from '@webext-core/match-patterns'
import { contentLogger, injectLogger } from 'lib/logger'
import { onMessage } from 'lib/messaging'
import { websiteMessenger } from 'lib/messaging/customEvent'
import { contentExecuted, pageChange, playbackRate, togglePlayback, volume } from 'lib/storage/items'
import { waitForMedia } from 'lib/util/scriptCommon'
import script from '~/entrypoints/inject.content'

type MediaAdapter = {
    apply: (property: MediaProperty, value: number) => void
    bind: (reason: 'initial' | 'pageChange') => Promise<void>
    toggle: () => void
}

const INJECTS = Array.isArray(script.matches) ? script.matches : []

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
                contentLogger.error('no media found.')
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
            if (reason === 'initial') {
                websiteMessenger.sendMessage('setup')
                const { value: vol } = await websiteMessenger.sendMessage('getValue', { property: 'volume' })
                const { value: rate } = await websiteMessenger.sendMessage('getValue', { property: 'playbackRate' })
                await volume.setValue(vol)
                await playbackRate.setValue(rate)
            }
            else {
                websiteMessenger.sendMessage('pageChange')
                this.apply('volume', await volume.getValue())
                this.apply('playbackRate', await playbackRate.getValue())
            }
        },

        toggle() {
            websiteMessenger.sendMessage('togglePlayback')
        },
    }
}

async function init() {
    contentLogger.info('Music Mixer CONTENT: executed.')
    websiteMessenger.onMessage('log', ({ data }) => {
        contentLogger.debug('got log from injected script', data)
        injectLogger.debug(data)
    })

    const isInjected = INJECTS.some(url => new MatchPattern(url).includes(window.location))
    const adapter = isInjected ? injectedAdapter() : directAdapter()

    const isReturning = await pageChange.getValue()
    await adapter.bind(isReturning ? 'pageChange' : 'initial')
    if (isReturning)
        await pageChange.setValue(false)

    const unwatchVolume = volume.watch(value => adapter.apply('volume', value))
    const unwatchPlaybackRate = playbackRate.watch(value => adapter.apply('playbackRate', value))

    const unwatchPageChange = pageChange.watch((isChanging) => {
        if (isChanging) {
            contentLogger.debug('pageChange detected')
            adapter.bind('pageChange')
            pageChange.setValue(false)
        }
    })

    const unwatchTogglePlayback = togglePlayback.watch((toggle) => {
        if (toggle) {
            adapter.toggle()
            togglePlayback.setValue(false)
        }
    })

    onMessage('teardownContent', async () => {
        contentLogger.info('teardownContent received, tearing down')
        unwatchVolume()
        unwatchPlaybackRate()
        unwatchPageChange()
        unwatchTogglePlayback()
        if (isInjected) {
            websiteMessenger.sendMessage('teardown')
        }
        websiteMessenger.removeAllListeners()
        await contentExecuted.setValue(false)
    })
}

export default defineContentScript({
    registration: 'runtime',
    matches: [...INJECTS],
    async main() {
        if (!await contentExecuted.getValue()) {
            await init()
            await contentExecuted.setValue(true)
        }
    },
})
