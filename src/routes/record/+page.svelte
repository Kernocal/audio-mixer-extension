<script lang="ts">
	import { browser } from "$app/environment";
	import { setStorage } from "$lib/util/util";
	import { tabCapture } from '$lib/util/handleTab';
	import { messages } from "$lib/data";
	import { PitchShift, Reverb, setContext, connect } from 'tone';
	import type { Reverb as ReverbType, PitchShift as PitchType } from 'tone';
	import type { ToneProperty } from '$lib/types';

	let pitchShift: PitchType;
	let reverb: ReverbType;

	async function setValue(type: ToneProperty, value: number) {
		try {
			switch (type) {
				case "pitch":
					pitchShift.pitch = value;
					break;
				case "pitchWet":
					pitchShift.wet.value = value;
					break;
				case "reverbDecay":
					reverb.decay = value;
					break;
				case "reverbWet":
					reverb.wet.value = value;
					break;
			}
			await setStorage(type, value);
		} catch (e) {
			console.warn(messages.SET_VALUE, type, value, e);
		}
	}

	async function startRecord() {
		const stream = await tabCapture();
		if (!stream) {
			console.warn(messages.CAPTURE_TAB_ERROR, stream);
			window.close();
			return null;
		}
		const context = new AudioContext();
		const audioStream = context.createMediaStreamSource(stream);
		const gainNode = context.createGain();
		audioStream.connect(gainNode);
		const toneContext = setContext(context);

		pitchShift = new PitchShift({
			pitch: 0,
			wet: 0,
		});

		reverb = new Reverb({
			wet: 0,
			decay: 0.01,
			preDelay: 0.01,
		});

		connect(gainNode, reverb);
		connect(reverb, pitchShift);
		connect(pitchShift, context.destination);
	}

	if (browser) {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
				if (request.command === "START_RECORDING") {
					startRecord().then(() => {
						sendResponse({message: "success"});
					});
					return true;
				}
				//Can add getValue if needed, right now isn't needed like volume and playbackRate.
				if (request.command === "SET_VALUE" && ["pitch", "pitchWet", "reverbDecay", "reverbWet"].includes(request.type)) {
					setValue(request.type, request.value).then(() => {
						sendResponse({message: "success"});
					});
					return true;
				}
			}
		);
	}
</script>

<!-- Pitch {pitchShift?.pitch} {pitchShift?.wet?.value}
Reverb {reverb?.decay} {reverb?.wet?.value} -->
