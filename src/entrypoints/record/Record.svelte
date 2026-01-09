<script lang='ts'>
    import type { ToneProperty } from 'lib/types'
    import type { PitchShift as PitchType, Reverb as ReverbType } from 'tone'
    import { messages } from 'lib/data'
    import { tabCapture } from 'lib/util/handleTab'
    import { setStorage } from 'lib/util/util'
    import { onMount } from 'svelte'
    import { connect, PitchShift, Reverb, setContext } from 'tone'

    let pitchShift: PitchType | undefined
    let reverb: ReverbType | undefined

    async function setValue(type: ToneProperty, value: number) {
        if (!pitchShift || !reverb) {
            return
        }

        try {
            switch (type) {
                case 'pitch':
                    pitchShift.pitch = value
                    break
                case 'pitchWet':
                    pitchShift.wet.value = value
                    break
                case 'reverbDecay':
                    reverb.decay = value
                    break
                case 'reverbWet':
                    reverb.wet.value = value
                    break
            }
            await setStorage(type, value)
        }
        catch (e) {
            console.warn(messages.SET_VALUE, type, value, e)
        }
    }

    async function startRecord() {
        const stream = await tabCapture()
        if (!stream) {
            console.warn(messages.CAPTURE_TAB_ERROR, stream)
            window.close()
            return null
        }
        const context = new AudioContext()
        const audioStream = context.createMediaStreamSource(stream)
        const gainNode = context.createGain()
        audioStream.connect(gainNode)

        // tone.js needs to be told about the context
        setContext(context)

        pitchShift = new PitchShift({
            pitch: 0,
            wet: 0,
        })

        reverb = new Reverb({
            wet: 0,
            decay: 0.01,
            preDelay: 0.01,
        })

        connect(gainNode, reverb)
        connect(reverb, pitchShift)
        connect(pitchShift, context.destination)
    }

    onMount(() => {
        const listener = (request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
            if (request.command === 'START_RECORDING') {
                startRecord().then(() => {
                    sendResponse({ message: 'success' })
                })
                return true
            }

            if (request.command === 'SET_VALUE' && ['pitch', 'pitchWet', 'reverbDecay', 'reverbWet'].includes(request.type)) {
                setValue(request.type, request.value).then(() => {
                    sendResponse({ message: 'success' })
                })
                return true
            }
        }

        chrome.runtime.onMessage.addListener(listener)
        return () => chrome.runtime.onMessage.removeListener(listener)
    })
</script>

<div class='recording-indicator'>
    <div class='status-card'>
        <h1>Audio Mixer</h1>
        <div class='indicator'>
            <span class='dot'></span>
            <span>Recording Active</span>
        </div>
        <p>This tab manages the audio processing for your mixer.</p>
        <p class='warning'>Do not close this tab while using the mixer.</p>
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
    .recording-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        color: white;
        font-family: 'Outfit', 'Inter', sans-serif;
    }
    .status-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        padding: 2rem;
        border-radius: 1.5rem;
        border: 1px solid rgba(168, 85, 247, 0.2);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        max-width: 400px;
        text-align: center;
    }
    h1 {
        margin-top: 0;
        color: #a855f7;
        font-size: 1.5rem;
        letter-spacing: 0.05em;
    }
    .indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin: 1.5rem 0;
        font-weight: 500;
        color: #e9d5ff;
    }
    .dot {
        width: 12px;
        height: 12px;
        background-color: #a855f7;
        border-radius: 50%;
        box-shadow: 0 0 10px #a855f7;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
    }
    p {
        color: #94a3b8;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    .warning {
        font-size: 0.8rem;
        color: #f87171;
        margin-top: 1rem;
        font-style: italic;
    }
</style>
