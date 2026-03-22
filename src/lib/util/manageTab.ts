import { browser } from '#imports'

export async function getActiveTab() {
    const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
    })
    return tab ?? {}
}
