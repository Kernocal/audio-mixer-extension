import type { ContentCommand, PopUpCommands } from '../types'
import { MESSAGES } from '../data'

export async function getTab(tabId: number) {
    try {
        return await chrome.tabs.get(tabId)
    }
    catch (e) {
        console.warn(MESSAGES.GET_TAB, e)
        return null
    }
}

export async function removeTab(tabId: number) {
    try {
        return await chrome.tabs.remove(tabId)
    }
    catch (e) {
        console.warn(MESSAGES.REMOVE_TAB, e)
        return null
    }
}

export function getActiveTab(): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            resolve(tabs[0])
        })
    })
}

// export function openRecordTab(): Promise<chrome.tabs.Tab> {
//     return new Promise((resolve) => {
//         try {
//             chrome.tabs.create({
//                 pinned: true,
//                 active: false,
//                 url: `chrome-extension://${chrome.runtime.id}/record.html`,
//             }, (tab) => {
//                 resolve(tab)
//             })
//         }
//         catch (e) {
//             console.warn(MESSAGES.CREATE_TAB, e)
//         }
//     })
// }

export async function openRecordTab(): Promise<boolean> {
    try {
        await chrome.offscreen.createDocument({
            url: `chrome-extension://${chrome.runtime.id}/record.html`,
            reasons: [chrome.offscreen.Reason.CLIPBOARD],
            justification: 'Mixing audio from user media',
        })
        return true
    }
    catch (e) {
        console.warn(MESSAGES.CREATE_TAB, e)
        return false
    }
}

export async function sendTabCommand(tabId: number, data: object, warn = true) {
    try {
        console.log(`Sending command to tab ${tabId} data ${JSON.stringify(data)}`)

        return await chrome.tabs.sendMessage(tabId, data)
    }
    catch (e) {
        if (warn) {
            console.warn(MESSAGES.COMMAND_FAILED, e)
        }
        return null
    }
}

// function sendCommand(data: PopUpCommands, text: string) {
//     try {
//         chrome.runtime.sendMessage(data, (response) => {
//             if (response?.message === 'success') {
//                 STATUS = text
//             }
//             else {
//                 STATUS = MESSAGES.STATUS_FAILED_COMMAND
//             }
//         })
//     }
//     catch (e) {
//         console.warn(e)
//     }
// }

export async function sendContentTabCommand(data: ContentCommand, warn = true) {
    const tabId = await storage.getItem<number>('session:contentTab')
    if (!tabId) {
        console.warn('Error: storage content tab empty')
        return null
    }
    return await sendTabCommand(tabId, data, warn)
}
