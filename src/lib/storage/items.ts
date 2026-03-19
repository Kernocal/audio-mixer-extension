import type { Preset } from 'lib/types'
import { storage } from '#imports'
import { DEFAULT_PRESETS } from 'lib/data'

export const volume = storage.defineItem<number>('session:volume', { fallback: 0.06767 })
export const playbackRate = storage.defineItem<number>('session:playbackRate', { fallback: 1 })
export const pitch = storage.defineItem<number>('session:pitch', { fallback: 0 })
export const pitchWet = storage.defineItem<number>('session:pitchWet', { fallback: 0 })
export const reverbDecay = storage.defineItem<number>('session:reverbDecay', { fallback: 0.01 })
export const reverbWet = storage.defineItem<number>('session:reverbWet', { fallback: 0 })

// popup
export const presets = storage.defineItem<Preset[]>('local:presets', { fallback: DEFAULT_PRESETS })
export const togglePlayback = storage.defineItem<boolean>('session:togglePlayback', { fallback: false })

// background
// default of 0 may break stuff gl
export const contentTabId = storage.defineItem<number>('session:contentTabId', { fallback: 0 })
export const contentTabUrl = storage.defineItem<string>('session:contentTabUrl', { fallback: '' })
export const installDate = storage.defineItem<string>('local:installDate', { fallback: '' })
export const pageChange = storage.defineItem<boolean>('session:pageChange', { fallback: false })

// content
export const contentExecuted = storage.defineItem<boolean>('session:contentExecuted', { fallback: false })
