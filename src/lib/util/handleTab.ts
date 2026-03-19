import { i18n } from '#i18n'
import { miscLogger } from '../logger'

// unused for now
// export async function getTab(tabId: number) {
//     try {
//         return await chrome.tabs.get(tabId)
//     }
//     catch (e) {
//         miscLogger.warn(i18n.t('errors.tabs.get'), e)
//         return null
//     }
// }

// export async function removeTab(tabId: number) {
//     try {
//         return await chrome.tabs.remove(tabId)
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
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    })
    return tab
}

export async function isRecordOpen() {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    })
    return contexts.length > 0
}

export async function openRecordDoc(streamId: string) {
    try {
        await chrome.offscreen.createDocument({
            url: `chrome-extension://${chrome.runtime.id}/record.html?streamId=${encodeURIComponent(streamId)}`,
            reasons: [chrome.offscreen.Reason.CLIPBOARD],
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
    await chrome.offscreen.closeDocument()
}
