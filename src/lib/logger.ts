import type { ILogObj } from 'tslog'
import { Logger } from 'tslog'

// const extensionName = typeof browser !== 'undefined' ? i18n.t('extension.name') : 'Audio Mixer'

export const extensionLogger: Logger<ILogObj> = new Logger({
    name: 'Music Mixer',
    minLevel: import.meta.env.PROD ? 4 : 2,
    type: 'pretty',
})

export const backgroundLogger = extensionLogger.getSubLogger({ name: 'Background' })
export const popupLogger = extensionLogger.getSubLogger({ name: 'Popup' })
export const recordLogger = extensionLogger.getSubLogger({ name: 'Record' })
export const contentLogger = extensionLogger.getSubLogger({ name: 'Content' })
export const injectLogger = contentLogger.getSubLogger({ name: 'Inject' })
