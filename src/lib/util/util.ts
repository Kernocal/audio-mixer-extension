import { MESSAGES } from '../data'
import { miscLogger } from '../logger'

export function sleep(ms = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function roundNumber(number: number, amount: 0 | 1 | 2 | 3 | 4 = 0) {
    return Number.parseFloat(number.toFixed(amount))
}

export function URLIncludes(name: string) {
    return window.location.host.includes(name)
}

export function compareObjects(obj1: object, obj2: object) {
    miscLogger.debug('Comparing', obj1, 'vs', obj2)
    return Object.entries(obj1).sort().toString() === Object.entries(obj2).sort().toString()
}

export function executeScript(tabId: number, filePath: string): Promise<void> {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({ target: { tabId }, files: [filePath] }, () => {
            resolve()
        })
    })
}

export function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        document.body.appendChild(script)
        script.addEventListener('load', () => resolve())
        script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)))
    })
}

export function setElementAttributes(query: string, data: object) {
    const elements = document.querySelectorAll(query)
    if (elements.length === 1) {
        try {
            for (const [attribute, attributeValue] of Object.entries(data)) {
                elements[0].setAttribute(attribute, attributeValue)
            }
        }
        catch (e) {
            miscLogger.warn(MESSAGES.QUERY_UNABLE_SET_ATTRIBUTE, data, e)
        }
    }
    else if (elements.length > 1) {
        miscLogger.warn(MESSAGES.QUERY_MULTIPLE, query, elements)
    }
    else {
        miscLogger.warn(MESSAGES.QUERY_NONE, query)
    }
}
