import { browser, i18n } from '#imports'
import { miscLogger } from '../logger'

// unused for now
// export async function getTab(tabId: number) {
//     try {
//         return await browser.tabs.get(tabId)
//     }
//     catch (e) {
//         miscLogger.warn(i18n.t('errors.tabs.get'), e)
//         return null
//     }
// }

// export async function removeTab(tabId: number) {
//     try {
//         return await browser.tabs.remove(tabId)
//     }
//     catch (e) {
//         miscLogger.warn(i18n.t('errors.tabs.removeContent'), e)
//         return null
//     }
// }

// async function getContentTab() {
//     const tabId = await contentTab.getValue()
//     if (!tabId) {
//         throw new Error('expected content tab id, none found')
//     }
//     return tabId
// }

export async function getActiveTab() {
    const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
    })
    return tab
}

export async function isRecordOpen() {
    const contexts = await browser.runtime.getContexts({
        contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    })
    return contexts.length > 0
}

export async function openRecordDoc(streamId: string) {
    try {
        // should be fine for chromium forks
        await browser.offscreen.createDocument({
            url: `chrome-extension://${browser.runtime.id}/record.html?streamId=${encodeURIComponent(streamId)}`,
            reasons: [browser.offscreen.Reason.CLIPBOARD],
            justification: 'Mixing audio from user media',
        })
        return true
    }
    catch (e) {
        miscLogger.warn(i18n.t('errors.tabs.create'), e)
        return false
    }
}

export async function closeRecordDoc() {
    const isOpen = await isRecordOpen()
    if (!isOpen) {
        miscLogger.warn(i18n.t('errors.tabs.removeRecord'))
        return
    }
    await browser.offscreen.closeDocument()
}
