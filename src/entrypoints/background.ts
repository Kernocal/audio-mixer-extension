import { storage } from '#imports'
import { DEFAULT_PRESETS, MESSAGES } from 'lib/data'
import { Commands, sendRuntime, sendTab } from 'lib/messaging/communication'
import { getActiveTab, openRecordTab } from 'lib/util/handleTab'
import { executeScript, sleep } from 'lib/util/util'
import { getProperty, setProperty } from 'lib/valueManager'
import { backgroundLogger } from 'lib/logger'

async function getContentTab() {
    const tabId = await storage.getItem<number>('session:contentTab')
    if (!tabId) {
        throw new Error('expected content tab id, none found')
    }
    return tabId
}

async function getContentValue(property: 'volume' | 'playbackRate') {
    const res = await sendTab(await getContentTab(), { target: 'content', command: Commands.GET_VALUE, data: property })
    backgroundLogger.debug('getContentValue: ', property, res)
    return res?.value
}

async function executeContent() {
    const contentTabId = await storage.getItem<number>('session:contentTab')
    if (contentTabId) {
        backgroundLogger.info('Executing content script')
        await executeScript(contentTabId, 'content-scripts/content.js')
        await sleep(500)
    }
}

async function getStreamID(tabid: number) {
    return new Promise((resolve) => {
        chrome.tabCapture.getMediaStreamId({
            targetTabId: tabid,
        }, (streamId) => {
            resolve(streamId)
        })
    })
}

async function startRecording() {
    const recordTab = await openRecordTab()
    if (recordTab) {
        await storage.setItem('session:recordTab', true)
        await sleep(500)
        const tabId = await storage.getItem<number>('session:contentTab')
        if (!tabId) {
            throw new Error('expected content tab id, none found')
        }
        const streamId = await getStreamID(tabId)
        if (!streamId) {
            throw new Error('expected stream id, none found')
        }
        await sendRuntime({ target: 'offscreen', command: Commands.RECORD, data: { streamId } })
    }
}

async function alreadyRecording() {
    // maybe get volume from media? prob not
    return {
        pitch: await getProperty('pitch'),
        pitchWet: await getProperty('pitchWet'),
        reverbDecay: await getProperty('reverbDecay'),
        reverbWet: await getProperty('reverbWet'),
        volume: await getProperty('volume'),
        playbackRate: await getProperty('playbackRate'),
        message: MESSAGES.STATUS_ALREADY_PLAYING,
    }
}

async function runMixer() {
    const contentTab: chrome.tabs.Tab = await getActiveTab()
    backgroundLogger.debug(`Content tab: ${contentTab}`)

    const recordTab = await storage.getItem<number>('session:recordTab')
    backgroundLogger.debug(`Record tab: ${recordTab}`)
    await storage.setItem('session:contentTab', contentTab.id)
    await storage.setItem('session:contentTabURL', contentTab.url)
    if (!contentTab?.audible) {
        return { message: MESSAGES.STATUS_NO_AUDIO_CONTENT }
    }
    if (!recordTab) {
        await executeContent()
        await startRecording()
        const res = {
            message: MESSAGES.STATUS_PLAYING,
            volume: await getContentValue('volume'),
            playbackRate: await getContentValue('playbackRate'),
        }
        backgroundLogger.info('Recording: ', res)
        return res
    }
    return await alreadyRecording()
}

async function getAllStorage(type: StorageArea) {
    backgroundLogger.debug(`${type} storage`, await storage.snapshot(type))
}

async function pageChange(url: string) {
    const res = await sendTab(await getContentTab(), { target: 'content', command: Commands.PING })
    const volume = await getProperty('volume')
    const playbackRate = await getProperty('playbackRate')
    await storage.setItem('session:contentTabURL', url)
    // what is this LMAO?
    if (res?.message !== 'PONG') {
        backgroundLogger.warn('Page change failed pong')
        await storage.setItem('session:contentExecuted', false)
        await storage.setItem('session:pageChange', true)
        await executeContent()
    }
    await sendTab(await getContentTab(), { target: 'content', command: Commands.PAGE_CHANGE, data: { volume, playbackRate } })
}

export default defineBackground(() => {
    chrome.runtime.onInstalled.addListener(async () => {
        await storage.clear('local')
        chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
        await storage.watch<number>(
            'local:installDate',
            (newInstallDate, oldInstallDate) => {
                backgroundLogger.info('New install date', newInstallDate)
                backgroundLogger.info('Old install date', oldInstallDate)
            },
        )

        await storage.setItem('local:installDate', new Date().toISOString())
        await storage.setItem('local:presets', DEFAULT_PRESETS)
        await getAllStorage('session')
        await getAllStorage('local')
    })

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        const { target = '', command, data = {} } = request
        if (command === Commands.START_MIXER) {
            runMixer().then((res) => {
                sendResponse(res)
            })
            return true
        }
        if (command === Commands.EXIT_MIXER) {
            // exitRecordTab().then((res) => {
            //     sendResponse(res)
            // })
            return true
        }
        if (target === 'background' && command === Commands.SET_VALUE) {
            // this is dumb its only meant to be for record because it doesnt have access to storage
            // but i guess we could just set the storage in background hmmmmmmm
            if (data.property === 'pitch' || data.property === 'pitchWet' || data.property === 'reverbDecay' || data.property === 'reverbWet') {
                backgroundLogger.debug(`Special set value ${data.property} to ${data.value}`)
                setProperty(data.property, data.value)
            }
        }
        if ([Commands.GET_VALUE, Commands.SET_VALUE, Commands.TOGGLE_PLAYBACK].includes(command)) {
            getContentTab().then((contentTab) => {
                sendTab(contentTab, { target: 'content', command, data }).then((res) => {
                    sendResponse(res)
                })
            })
            return true
        }
    })

    chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
        const contentTabId = await storage.getItem<number>('session:contentTab')
        if (details.tabId === contentTabId && details.frameType === 'outermost_frame') {
            backgroundLogger.info('New domain: ', details)
            await pageChange(details.url)
        }
    })

    chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
        const contentTabId = await storage.getItem<number>('session:contentTab')
        const contentTabURL = await storage.getItem<string>('session:contentTabURL')
        if (tabId === contentTabId && url !== contentTabURL) {
            chrome.tabs.onUpdated.addListener(async function update(tabId, changeInfo) {
                if (tabId === contentTabId && changeInfo.title) {
                    backgroundLogger.info('Same domain:', url)

                    await pageChange(url)
                    chrome.tabs.onUpdated.removeListener(update)
                }
            })
        }
    })

    chrome.tabs.onRemoved.addListener(async (tabId) => {
        const contentTabId = await storage.getItem<number>('session:contentTab')
        if (tabId === contentTabId) {
            const recordTab = await storage.getItem<number>('session:recordTab')
            if (recordTab) {
                //
                return { message: MESSAGES.STATUS_QUIT }
            }
            // maybe only remove tabids
            // await storage.removeItem('session:contentTab')
            // await storage.removeItem('session:recordTab')
            await storage.clear('session')
            backgroundLogger.info(MESSAGES.EXITING)
        }
    })
})
