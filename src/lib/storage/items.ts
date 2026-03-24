import type { Preset } from 'lib/types'
import { storage } from '#imports'

const DEFAULT_PRESETS: Preset[] = [
    { name: 'Default/Reset', user: false, properties: { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 0.01, reverbWet: 0 } },
    { name: 'Classic Nightcore', user: false, properties: { playbackRate: 1.25, pitch: 3, pitchWet: 1, reverbDecay: 0.01, reverbWet: 0 } },
    { name: '(slowed + reverb)', user: false, properties: { playbackRate: 0.75, pitch: 0, pitchWet: 0, reverbDecay: 1, reverbWet: 0.7 } },
    { name: 'Roomy Reverb', user: false, properties: { playbackRate: 1, pitch: 0, pitchWet: 0, reverbDecay: 1.5, reverbWet: 0.8 } },
]

export const volume = storage.defineItem<number>('session:volume', { fallback: 0.06767 })
export const playbackRate = storage.defineItem<number>('session:playbackRate', { fallback: 1 })
export const pitch = storage.defineItem<number>('session:pitch', { fallback: 0 })
export const pitchWet = storage.defineItem<number>('session:pitchWet', { fallback: 0 })
export const reverbDecay = storage.defineItem<number>('session:reverbDecay', { fallback: 0.01 })
export const reverbWet = storage.defineItem<number>('session:reverbWet', { fallback: 0 })

export const presets = storage.defineItem<Preset[]>('local:presets', { fallback: DEFAULT_PRESETS })
export const togglePlayback = storage.defineItem<boolean>('session:togglePlayback', { fallback: false })
export const animation = storage.defineItem<boolean>('local:animation', { fallback: true })
export const knobStyle = storage.defineItem<string>('local:knobStyle', { fallback: '/knobs/SmallLedKnob2.png' })

// background
// default of 0 may break stuff gl
export const contentTabId = storage.defineItem<number>('session:contentTabId', { fallback: 0 })
export const contentTabUrl = storage.defineItem<string>('session:contentTabUrl', { fallback: '' })
export const installDate = storage.defineItem<string>('local:installDate', { fallback: '' })
export const pageChange = storage.defineItem<boolean>('session:pageChange', { fallback: false })

// content
export const contentExecuted = storage.defineItem<boolean>('session:contentExecuted', { fallback: false })
