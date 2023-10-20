<script>
	import {browser} from '$app/environment'
	import {loadScript, getStorage, setStorage} from '$lib/util/util';

	let pitchShift;
	let reverb;

	function tabCapture() {
		return new Promise((resolve) => {
		chrome.tabCapture.capture(
			{audio: true, video: false}, (stream) => {
			resolve(stream);
			}
		);
		});
	}

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
			const val = await setStorage(type, value);
		} catch (e) {console.error(e);}
	}

	async function startRecord() {
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
				"pitch": 0,
				"wet": 0
			});

			reverb = new Tone.Reverb({
				"wet": 0,
				"decay": 0.01,
				"preDelay": 0.01
			});

			//Connecting in order compared to in parallel seems to be better quality.
			Tone.connect(gainNode, reverb)
			Tone.connect(reverb, pitchShift)
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
		loadScript("scripts/Tone.js")
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			const [message, type] = request.message.split("-");
			
			if (message === "start" && type === "recording") {
				startRecord();
				sendResponse({message: "success"});
			}
			if (message === "update") {
				const value = request[type];
				// console.log("Changing", type, value);
				updateValue(type, value);
				sendResponse({message: "success", [type]: value});
			}
		});
	}
</script>