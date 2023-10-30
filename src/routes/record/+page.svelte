<script lang="ts">
	import { browser } from "$app/environment";
	import { setStorage } from "$lib/util/util";
	import { tabCapture } from '$lib/util/handleTab';
	import { messages } from "$lib/data";
	import { PitchShift, Reverb, setContext, connect } from 'tone';
	import type { Reverb as ReverbType, PitchShift as PitchType } from 'tone';
	import type { ToneProperty } from '$lib/types';

	let pitchShift: PitchType;
	let myReverb: ReverbType;

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
					myReverb.decay = value;
					break;
				case "reverbWet":
					myReverb.wet.value = value;
					break;
			}
			await setStorage(type, value);
		} catch (e) {
			console.warn(messages.SET_VALUE, type, value, e);
		}
	}

	async function startRecord() {
		const stream = await tabCapture();

		if (stream) {
			let context = new AudioContext();
			let audioStream = context.createMediaStreamSource(stream);
			let gainNode = context.createGain();
			audioStream.connect(gainNode);
			const toneContext = setContext(context);

			pitchShift = new PitchShift({
				pitch: 0,
				wet: 0,
			});

			myReverb = new Reverb({
				wet: 0,
				decay: 0.01,
				preDelay: 0.01,
			});

			connect(gainNode, myReverb);
			connect(myReverb, pitchShift);
			connect(pitchShift, context.destination);
		} else {
			console.warn(messages.CAPTURE_TAB_ERROR, stream);
			window.close();
		}
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
						sendResponse({message: "success", type:request.type, value: request.value});
					});
					return true;
				}
			}
		);
	}
</script>

<!-- Pitch {pitchShift?.pitch} {pitchShift?.wet?.value}
Reverb {reverb?.decay} {reverb?.wet?.value} -->
