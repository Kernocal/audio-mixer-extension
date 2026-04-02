import { browser } from '#imports'
import { backgroundLogger } from '../logger'

export type ValidatedTab = Browser.tabs.Tab & { id: number, url: string }

export function validTab(tab: Browser.tabs.Tab): tab is ValidatedTab {
    if (!tab.id || !tab.url) {
        backgroundLogger.warn('no active tab found.')
        return false
    }
    const invalidUrlPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'edge-extension://', 'about:']
    if (invalidUrlPrefixes.some(url => tab.url?.startsWith(url))) {
        backgroundLogger.warn('tab is not valid.')
        return false
    }
    return true
}

export async function getActiveTab() {
    const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
    })
    return tab
}
