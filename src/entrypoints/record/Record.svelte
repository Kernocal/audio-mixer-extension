<script lang='ts'>
    import type { PitchShift as PitchType, Reverb as ReverbType } from 'tone'
    import { i18n } from '#imports'
    import { recordLogger } from 'lib/logger'
    import { onMessage } from 'lib/messaging'
    import { onMount } from 'svelte'
    import { connect, PitchShift, Reverb, setContext } from 'tone'

    let audioContext: AudioContext | null = null
    let pitchShift: PitchType | null = null
    let reverb: ReverbType | null = null

    async function startRecord(stream: MediaStream) {
        recordLogger.debug(`2nd stream: ${stream}`)
        if (!stream) {
            recordLogger.warn(i18n.t('errors.capture.tabError'), stream)
            window.close()
            return null
        }

        if (audioContext) {
            recordLogger.warn('audioContext already exists')
            await audioContext.close()
        }

        audioContext = new AudioContext()
        const audioStream = audioContext.createMediaStreamSource(stream)
        const gainNode = audioContext.createGain()
        audioStream.connect(gainNode)

        setContext(audioContext)

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
        connect(pitchShift, audioContext.destination)
    }

    onMount(() => {
        recordLogger.info(`Offscreen is alive, vals ${audioContext}, ${pitchShift}, ${reverb}`)

        const removeRecord = onMessage('record', async () => {
            try {
                const params = new URLSearchParams(window.location.search)
                const streamId = params.get('streamId')
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: { // mandatory is (maybe) deprecated
                            chromeMediaSource: 'tab',
                            chromeMediaSourceId: streamId,
                        },
                    },
                } as MediaStreamConstraints)
                await startRecord(stream)
            }
            catch (error) {
                recordLogger.error('Error getting media stream:', error)
            }
        })

        const removeSetValue = onMessage('setOffscreenValue', ({ data }) => {
            if (!pitchShift || !reverb) {
                recordLogger.warn('Received value update before audio initialization')
                return
            }
            switch (data.property) {
                case 'pitch':
                    pitchShift.pitch = data.value
                    break
                case 'pitchWet':
                    pitchShift.wet.value = data.value
                    break
                case 'reverbDecay':
                    reverb.decay = data.value
                    break
                case 'reverbWet':
                    reverb.wet.value = data.value
                    break
            }
        })

        return () => {
            // i forgot background dies and re dies
            removeRecord()
            removeSetValue()
            audioContext?.close()
        }
    })
</script>
