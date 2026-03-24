import { knobStyle } from 'lib/storage/items.svelte'

const knobs = ['/knobs/SmallLedKnob2.png', '/knobs/CarbonPurple.png']

function computeFrameCount(src: string): Promise<number> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(Math.round(img.naturalHeight / img.naturalWidth) - 1)
        img.src = src
    })
}

export async function allKnobs() {
    return Promise.all(
        knobs.map(async (url) => {
            const frameCount = await computeFrameCount(url)
            const name = url.split('/').pop()?.replace('.png', '') ?? ''
            return { url, name, size: `${48}px ${48 * (frameCount + 1)}px`, position: `${-Math.round(frameCount / 2) * 48}px` }
        }),
    )
}

export class KnobSprite {
    src = $derived(knobStyle.value)
    frameCount = $state(0)

    constructor() {
        $effect(() => {
            computeFrameCount(this.src).then(count => this.frameCount = count)
        })
    }
}
