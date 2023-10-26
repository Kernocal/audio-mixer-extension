<script lang="ts">
	import { browser } from "$app/environment";
	import { loadScript, getStorage, setStorage } from "$lib/util/util";
	import { tabCapture } from '$lib/util/handleTab';

	let pitchShift;
	let reverb;

	async function updateValue(type, value) {
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
			console.warn("Updating value error,", type, value, e);
		}
	}

	async function startRecord() {
		await loadScript("scripts/Tone.js");
		const stream = await tabCapture();

		if (stream) {
			stream.oninactive = () => {
				window.close();
			};

			let context = new AudioContext();
			let audioStream = context.createMediaStreamSource(stream);
			let gainNode = context.createGain();
			audioStream.connect(gainNode);

			let toneContext = Tone.setContext(context);
			pitchShift = new Tone.PitchShift({
				pitch: 0,
				wet: 0,
			});

			reverb = new Tone.Reverb({
				wet: 0,
				decay: 0.01,
				preDelay: 0.01,
			});

			//Connecting in order compared to in parallel seems to be better quality.
			Tone.connect(gainNode, reverb);
			Tone.connect(reverb, pitchShift);
			Tone.connect(pitchShift, context.destination);

			//In order has 2 posiblities, I prefer the one above.
			// Tone.connect(gainNode, pitchShift)
			// Tone.connect(pitchShift, reverb)
			// Tone.connect(reverb, context.destination);
		} else {
			console.log("No stream, exiting.", stream);
			window.close();
		}
	}

	if (browser) {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
				console.log("Options req", request);
				if (request.command === "START_RECORDING") {
					startRecord().then(() => {
						sendResponse({message: "success"});
					});
					return true;
				}
				//Can add getValue if needed, right now isn't needed like volume and playbackRate.
				if (["pitch", "pitchWet", "reverbDecay", "reverbWet"].includes(request.type)) {
					updateValue(request.type, request.value).then(() => {
						sendResponse({message: "success", [request.type]: request.value});
					});
					return true;
				}
			}
		);
	}
</script>

Pitch {pitchShift?.pitch} {pitchShift?.wet?.value}
Reverb {reverb?.decay} {reverb?.wet?.value}
