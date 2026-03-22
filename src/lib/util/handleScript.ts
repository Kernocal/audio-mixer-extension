import { browser, i18n } from '#imports'
import { backgroundLogger } from '../logger'

export async function executeContent(tabId: number) {
    try {
        await browser.scripting.executeScript({
            target: {
                tabId,
            },
            files: ['/content-scripts/content.js'],
        })
        return true
    }
    catch (e) {
        backgroundLogger.error(`Failed to execute content script, contentTabId at the time: ${tabId} error: ${e}`)
        return false
    }
}
