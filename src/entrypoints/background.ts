import { browser, i18n, storage } from '#imports'
import { backgroundLogger } from 'lib/logger'
import { onMessage, sendMessage } from 'lib/messaging'
import { contentExecuted, contentTabId, contentTabUrl, installDate, pageChange } from 'lib/storage/items'
import { executeContent } from 'lib/util/handleScript'
import { fixLegacyPresets } from 'lib/util/legacy'
import { getActiveTab, validTab } from 'lib/util/manageTab'
import { closeRecordDoc, isRecordOpen, openRecordDoc } from 'lib/util/offscreen'

export default defineBackground(() => {
    async function exitMixer() {
        await closeRecordDoc()
        browser.action.setBadgeText({ text: '' })
        await storage.clear('session')
        backgroundLogger.info(i18n.t('messages.exiting'))
    }

    async function runMixer() {
        if (await isRecordOpen()) {
            return true
        }
        const activeTab = await getActiveTab()
        if (!validTab(activeTab)) {
            return false
        }
        const { id, url } = activeTab
        backgroundLogger.debug(`Content tab:`, { id, url })

        await contentTabId.setValue(id)
        await contentTabUrl.setValue(url)
        backgroundLogger.debug(`final stores:`, { contentTabId: await contentTabId.getValue(), contentTabUrl: await contentTabUrl.getValue() })
        await executeContent(id)
        const streamId = await browser.tabCapture.getMediaStreamId({ targetTabId: id })
        if (!streamId) {
            backgroundLogger.error('expected stream id, none found')
            return false
        }
        await openRecordDoc(streamId)
        if (!await sendMessage('record')) {
            backgroundLogger.error('failed to start recording')
            return false
        }
        browser.action.setBadgeText({ text: '+' })
        return true
    }
    onMessage('startMixer', async () => await runMixer())
    onMessage('exitMixer', async () => await exitMixer())

    // first time setup stuff
    browser.runtime.onInstalled.addListener(async (details) => {
        // random testing stuff
        installDate.watch((newInstallDate, oldInstallDate) => {
            backgroundLogger.info('New install date', newInstallDate)
            backgroundLogger.info('Old install date', oldInstallDate)
        })
        await installDate.setValue(new Date().toISOString())

        // debug stuff
        backgroundLogger.debug(`session storage`, await storage.snapshot('session'))
        backgroundLogger.debug(`local storage`, await storage.snapshot('local'))

        // real stuff
        await browser.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
        await fixLegacyPresets(details)
    })

    // stay working across page changes
    browser.webNavigation.onDOMContentLoaded.addListener(async (details) => {
        const contentTab = await contentTabId.getValue()
        if (details.tabId === contentTab && details.frameType === 'outermost_frame') {
            backgroundLogger.info('New domain: ', details)
            await contentTabUrl.setValue(details.url)
            await contentExecuted.setValue(false)
            await executeContent(contentTab)
        }
    })

    // SPAs (normally) update history for navigation,
    browser.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
        const contentTab = await contentTabId.getValue()
        const oldContentTabUrl = await contentTabUrl.getValue()
        if (tabId === contentTab && url !== oldContentTabUrl) {
            browser.tabs.onUpdated.addListener(async function listener(tabId, changeInfo) {
                if (tabId === contentTab && changeInfo.title) {
                    backgroundLogger.info('Same domain page change:', url)
                    await contentTabUrl.setValue(url)
                    await pageChange.setValue(true)
                    browser.tabs.onUpdated.removeListener(listener)
                }
            })
        }
    })

    browser.tabs.onRemoved.addListener(async (tabId) => {
        const contentTab = await contentTabId.getValue()
        if (tabId === contentTab) {
            await exitMixer()
        }
    })
})
