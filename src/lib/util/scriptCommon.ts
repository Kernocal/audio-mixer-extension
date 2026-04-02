export function scoreMediaElement(el: HTMLMediaElement): number {
    return [
        el.currentTime > 0,
        !el.paused,
        !el.ended,
        el.readyState > 2,
        !el.muted,
        el.volume > 0,
        el.playbackRate !== 0,
        !!(el.currentSrc || el.src),
    ].filter(Boolean).length
}

export async function waitForMedia(signal: AbortSignal): Promise<HTMLMediaElement> {
    for (let i = 0; i < 20 && !signal.aborted; i++) {
        const mediaElements = [...document.querySelectorAll<HTMLMediaElement>('audio, video')]
        const scores = mediaElements.map(el => ({ el, score: scoreMediaElement(el) }))
        if (!scores.length)
            continue
        const aliveMedia = scores.reduce((best, current) => best.score >= current.score ? best : current).el
        if (aliveMedia) {
            return aliveMedia
        }
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    throw new Error('No media found')
}
