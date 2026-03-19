import type { MediaProperty, PropertyPayload } from 'lib/types'
import { defineCustomEventMessaging } from '@webext-core/messaging/page'

interface CustomEventProtocol {
    log: (message: string) => void
    setValue: (data: PropertyPayload<MediaProperty>) => void
    getValue: (data: { property: MediaProperty }) => PropertyPayload<MediaProperty>
    pageChange: () => void
    togglePlayback: () => void
}

export const websiteMessenger = defineCustomEventMessaging<CustomEventProtocol>({
    namespace: 'AUDIO_MIXER_',
})
