import { browser } from '#imports'
import { onMessage } from 'lib/messaging'
import { backgroundLogger } from '../logger'

export async function isRecordOpen() {
    const contexts = await browser.runtime.getContexts({
        contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
    })
    return contexts.length > 0
}

export async function openRecordDoc(streamId: string) {
    const ready = new Promise<void>((resolve) => {
        const remove = onMessage('offscreenReady', () => {
            remove()
            resolve()
        })
    })
    await browser.offscreen.createDocument({
        url: `chrome-extension://${browser.runtime.id}/record.html?streamId=${encodeURIComponent(streamId)}`,
        reasons: [browser.offscreen.Reason.USER_MEDIA],
        justification: 'Mixing audio from user media',
    })
    await ready
}

export async function closeRecordDoc() {
    const isOpen = await isRecordOpen()
    if (!isOpen) {
        backgroundLogger.warn('offscreen document isn\'t open but tried to be closed.')
        return
    }
    await browser.offscreen.closeDocument()
}
