import type { WxtStorageItem } from '#imports'
import * as items from './items'

class StorageValue<T> {
    #item: WxtStorageItem<T, Record<string, unknown>>
    #value: T = $state()!
    #ready: boolean = $state(false)
    #writing = false

    constructor(item: WxtStorageItem<T, Record<string, unknown>>) {
        this.#item = item
        this.#value = item.fallback

        item.getValue().then((v) => {
            this.#value = v
            this.#ready = true
        })

        item.watch((next) => {
            if (!this.#writing && next !== null) {
                this.#value = next
            }
        })
    }

    get value(): T { return this.#value }
    set value(next: T) {
        this.#value = next
        this.#writing = true
        void this.#item.setValue(next).finally(() => {
            this.#writing = false
        })
    }

    get ready(): boolean { return this.#ready }

    update(fn: (cur: T) => T) {
        this.value = fn(this.#value)
    }
}

export const volume = new StorageValue(items.volume)
export const playbackRate = new StorageValue(items.playbackRate)
export const pitch = new StorageValue(items.pitch)
export const pitchWet = new StorageValue(items.pitchWet)
export const reverbDecay = new StorageValue(items.reverbDecay)
export const reverbWet = new StorageValue(items.reverbWet)

export const presets = new StorageValue(items.presets)

export const togglePlayback = new StorageValue(items.togglePlayback)
