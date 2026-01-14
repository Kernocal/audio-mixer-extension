// popup -> background -> offscreen -> background
// -> content -> background
// popup -> background -> content
// offscreen -> background -> content

// content -> inject AUDIO_MIXER_${EVENT}
// inject -> content AUDIO_MIXER_${EVENT}

// background -> contentid content tabs.sendMessage
// content -> background runtime.sendMessage target = 'background'

// tabs.sendMessage target = ['content']
// runtime.sendMessage target = ['background', 'offscreen', 'popup']

import { MESSAGES } from 'lib/data'
import { miscLogger } from 'lib/logger'

type ContentProperty = 'volume' | 'playbackRate'
type ToneProperty = 'pitch' | 'pitchWet' | 'reverbDecay' | 'reverbWet'

export type Properties = ContentProperty | ToneProperty

// type ValueObject = Record<ContentProperty | ToneProperty, number>

export const Commands = {
    START_MIXER: 'START_MIXER',
    EXIT_MIXER: 'EXIT_MIXER',

    GET_VALUE: 'GET_VALUE',
    SET_VALUE: 'SET_VALUE',
    TOGGLE_PLAYBACK: 'TOGGLE_PLAYBACK',
    PAGE_CHANGE: 'PAGE_CHANGE',
    PING: 'PING',

    RECORD: 'RECORD',
} as const

interface Property {
    property: Properties
    value: number
}

interface BaseMessage {
    target: 'offscreen' | 'background' | 'popup' | 'content'
    command: keyof typeof Commands
    data?: any
}
// data?: Property | string
interface ContentMessage extends BaseMessage {
    target: 'content'
    tabId: number
}

interface RuntimeMessage extends BaseMessage {
    target: 'background' | 'popup' | 'offscreen'
}

// export async function sendCommand(message: ContentMessage | RuntimeMessage) {
//     const { target, command, data } = message
//     if (target === 'content') {
//         return await sendTab(message.tabId, { target, command, data })
//     }
//     else {
//         return await sendRuntime(message)
//     }
// }

export async function sendTab(tabId: number, message: BaseMessage) {
    try {
        return await chrome.tabs.sendMessage(tabId, message)
    }
    catch (e) {
        miscLogger.warn(`${MESSAGES.COMMAND_FAILED} to tab ${tabId} data ${message.data}`, e)
        return null
    }
}

export async function sendRuntime(message: BaseMessage) {
    try {
        return await chrome.runtime.sendMessage(message)
    }
    catch (e) {
        miscLogger.warn(`${MESSAGES.COMMAND_FAILED} to runtime target ${message.target} data ${message.data}`, e)
        return null
    }
}
