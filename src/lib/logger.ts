import type { ILogObj } from 'tslog'
import { Logger } from 'tslog'

const dev = true

function getLogLevel() {
    return dev ? 2 : 4
}

export const extensionLogger: Logger<ILogObj> = new Logger({
    name: 'Extension',
    minLevel: getLogLevel(),
    type: 'pretty',
})

export const backgroundLogger = extensionLogger.getSubLogger({ name: 'Background' })
export const popupLogger = extensionLogger.getSubLogger({ name: 'Popup' })
export const recordLogger = extensionLogger.getSubLogger({ name: 'Record' })
export const miscLogger = extensionLogger.getSubLogger({ name: 'Misc' })

export const contentLogger: Logger<ILogObj> = new Logger({
    name: 'Content',
    minLevel: getLogLevel(),
    type: 'pretty',
})
export const injectLogger = contentLogger.getSubLogger({ name: 'Inject' })
