import { browser, i18n } from '#imports'
import { backgroundLogger } from '../logger'

export type ValidatedTab = Browser.tabs.Tab & { id: number, url: string }

export function validTab(tab: Browser.tabs.Tab): tab is ValidatedTab {
    if (!tab.id || !tab.url) {
        backgroundLogger.error(i18n.t('errors.content.noActiveTab'))
        return false
    }
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
        backgroundLogger.error(i18n.t('errors.content.notValidTab'))
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
