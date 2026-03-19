import type { PropertyPayload, ToneProperty } from 'lib/types'
import { defineExtensionMessaging } from '@webext-core/messaging'

interface ProtocolMap {
    startMixer: () => boolean
    exitMixer: () => void
    record: () => void
    contentReady: () => void
    setOffscreenValue: (data: PropertyPayload<ToneProperty>) => void
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
