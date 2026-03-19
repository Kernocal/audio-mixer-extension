import { i18n } from '#i18n'
import { storage } from '#imports'
import { backgroundLogger } from 'lib/logger'
import { onMessage, sendMessage } from 'lib/messaging'
import { contentExecuted, contentTabId, contentTabUrl, installDate, pageChange, presets } from 'lib/storage/items'
import { closeRecordDoc, getActiveTab, isRecordOpen, openRecordDoc } from 'lib/util/handleTab'

async function executeContent(tabId: number) {
    try {
        await chrome.scripting.executeScript({
            target: {
                tabId,
            },
            files: ['content-scripts/content.js'],
        })
    }
    catch (e) {
        backgroundLogger.error(`Failed to execute content script, contentTabId at the time: ${tabId} error: ${e}`)
    }
}

async function runMixer() {
    const { id, url, audible } = await getActiveTab() ?? {}
    backgroundLogger.debug(`Content tab:`, { id, url, audible })
    if (!id || !url) {
        backgroundLogger.warn(i18n.t('errors.content.noActiveTab'))
        return false
    }
    if (!audible) {
        backgroundLogger.warn(i18n.t('status.noAudioContent'))
        return false
    }
    const isOpen = await isRecordOpen()
    if (isOpen) {
        return true
    }
    await contentTabId.setValue(id)
    await contentTabUrl.setValue(url)
    await executeContent(id)
    backgroundLogger.debug(`final stores:`, { contentTabId: await contentTabId.getValue(), contentTabUrl: await contentTabUrl.getValue() })
    return true
}

async function exitMixer() {
    await closeRecordDoc()
    await storage.clear('session')
    backgroundLogger.info(i18n.t('messages.exiting'))
}

async function startRecording() {
    const isOpen = await isRecordOpen()
    if (isOpen) {
        backgroundLogger.debug('Record doc already open, skipping capture')
        return
    }
    const targetTabId = await contentTabId.getValue()
    if (!targetTabId) {
        backgroundLogger.error('expected content tab id, none found')
        return
    }
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId })
    if (!streamId) {
        backgroundLogger.error('expected stream id, none found')
        return
    }
    const recordTabOpened = await openRecordDoc(streamId)
    if (!recordTabOpened) {
        return
    }
    await sendMessage('record')
}

export default defineBackground(() => {
    onMessage('startMixer', async () => await runMixer())
    onMessage('exitMixer', async () => await exitMixer())
    // content needs to send
    onMessage('contentReady', async () => await startRecording())

    // first time setup stuff
    chrome.runtime.onInstalled.addListener(async (details) => {
        // random testing stuff
        installDate.watch((newInstallDate, oldInstallDate) => {
            backgroundLogger.info('New install date', newInstallDate)
            backgroundLogger.info('Old install date', oldInstallDate)
        })
        await installDate.setValue(new Date().toISOString())

        // debug stuff
        backgroundLogger.debug(`session storage`, await storage.snapshot('session'))
        backgroundLogger.debug(`local storage`, await storage.snapshot('local'))
        backgroundLogger.debug(`test`, i18n.t('extension.name'))
        // await storage.clear('local')

        // real stuff
        await chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
        if (details.reason === 'install') {
            await presets.setValue(presets.fallback)
        }
    })

    // stay working across page changes
    chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
        const contentTab = await contentTabId.getValue()
        if (details.tabId === contentTab && details.frameType === 'outermost_frame') {
            backgroundLogger.info('New domain: ', details)
            await contentTabUrl.setValue(details.url)
            await contentExecuted.setValue(false)
            await pageChange.setValue(true)
            await executeContent(contentTab)
        }
    })

    // SPAs (normally) update history for navigation,
    chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
        const contentTab = await contentTabId.getValue()
        const oldContentTabUrl = await contentTabUrl.getValue()
        if (tabId === contentTab && url !== oldContentTabUrl) {
            chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo) {
                if (tabId === contentTab && changeInfo.title) {
                    backgroundLogger.info('Same domain:', url)
                    await contentTabUrl.setValue(url)
                    await pageChange.setValue(true)
                    chrome.tabs.onUpdated.removeListener(listener)
                }
            })
        }
    })

    chrome.tabs.onRemoved.addListener(async (tabId) => {
        // should be same as just exit button i guess
        const contentTab = await contentTabId.getValue()
        if (tabId === contentTab) {
            await exitMixer()
        }
    })
})
