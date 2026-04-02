import type { PropertyPayload, ToneProperty } from 'lib/types'
import { defineExtensionMessaging } from '@webext-core/messaging'

interface ProtocolMap {
    startMixer: () => boolean
    exitMixer: () => void
    record: () => boolean
    offscreenReady: () => void
    setOffscreenValue: (data: PropertyPayload<ToneProperty>) => void
    teardownContent: () => void
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
