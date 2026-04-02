import { browser } from '#imports'
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
    catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err)
        backgroundLogger.error(`Failed to execute content script, contentTabId at the time: ${tabId} error: ${errMessage}`)
        return false
    }
}
