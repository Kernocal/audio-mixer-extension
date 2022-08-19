<script>
	import {draggable} from '@neodrag/svelte';
	import {browser} from '$app/env'
	import {presets} from '$lib/data/presets'
	import {getStorage, setStorage, compareObjects} from '$lib/util/util';

	let properties = {pitch: 0, pitchWet: 0, reverbDecay: 0.01, reverbWet: 0, volume: 0, playbackRate: 0};
	let status = "Waiting for media."
	let activePreset = 0;
	let disabled = true;

	function setPreset(newPreset) {
		activePreset = newPreset;
		setStorage("preset", activePreset);
	}

	function getValidPreset(clone) {
		for (var i = 0; i < presets.length; i++) {
			if (i === presets.length - 1) {
				return i
			} else if (compareObjects(presets[i].values, clone)) {
				return i
			}
		}
	}

	function sendMessage(data, text = status) {
		chrome.runtime.sendMessage(data, response => {
			if (response?.message === 'success') {
				status = text;
			} else {
				status = "Failed."
			}
		});
	}

	function updateValue(type, value) {
		if (!disabled) {
			const property = type.split(/(?=[A-Z])/);
			let text = property[1] ? `Updated ${property[0]} ${property[1].toLowerCase()}.` : `Updated ${property[0]}.`;
			sendMessage({
				message: "update-" + type,
				[type]: value
			}, text)
			if (String(type) != "volume") {
				const propertiesClone = (({ volume, ...key}) => key)(properties)
				if (presets[activePreset] != propertiesClone) {
					const newPreset = getValidPreset(propertiesClone);
					setPreset(newPreset);
				}
			}
		}
	}

	function updateValues(newValues, scope) {
		for (let [key, value] of Object.entries(newValues)) {
    	    if (newValues.hasOwnProperty(key) && properties.hasOwnProperty(key)) {
				if (properties[key] !== value) {
            		properties[key] = value;
					if (scope === "global") {
						updateValue(String(key), value);
					}
				}
			}
    	}
	}

	function exitOptions() {
		properties.playbackRate = 1;
		updateValue("playbackRate", properties.playbackRate);
		sendMessage({message: "exit-options"}, "Exiting now.");
		window.close();
	}
	
	if (browser) {
		getStorage("preset").then((storedPreset) => {activePreset = storedPreset ?? activePreset;});
		chrome.runtime.sendMessage({
			message: 'start-playing',
			}, (response) => {
			if (["Playing.", "Already playing."].includes(response.message)) {
				disabled = false;
				updateValues(response, "local");
			}
			status = response.message;
		})
	}
	// disabled = false;

</script>

<!-- min-w-[400px] max-w-[400px] max-h-[532px] min-h-[532px] -->
<div class="min-w-[400px] min-h-[500px] opacity-80 bg-gradient-to-tr from-orange-600 via-pink-600 to-purple-700 background-animate blur children:()">
	<div class="grid-test children:(m-2)">
		<div class="flex flex-col grid-child-1 bg-green-300/20 rounded-sm children:(rounded-md p-2)">
			<h1 class="text big-text">Audio Presets:</h1>
			{#each presets as preset, i}
				<div class={(activePreset === i ? "bg-green-300/20" : "") + " hover:(bg-green-300/20)"} on:click={() => {
					setPreset(i);
					updateValues(presets[activePreset].values, "global");}}>
					<input class="ml-2 active:(bg-gray-400/20)" type="radio" name="activePreset" bind:group={activePreset} value={i}>
					<span class="text">{preset.name}</span>
				</div>
			{/each}
		</div>
		<div class={"flex flex-col justify-center items-center grid-child-2 rounded-md bg-green-300/20 " + (properties.pitchWet > 0 ? "bg-green-300/20" : "passive-bg") + " children:(p-1)"}>
			<h1 class="text big-text">Pitch</h1>
			<h2 class="text">Semitone Shift: {properties.pitch}</h2>
			<input class="" type="range" min="-12" max="12" step="1" {disabled} bind:value={properties.pitch} on:change={() => {updateValue("pitch", properties.pitch)}}>
			<h2 class="text">Active amount: {properties.pitchWet}</h2>
			<input class="" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.pitchWet} on:change={() => {updateValue("pitchWet", properties.pitchWet)}}>
		</div>
		<div class={"flex flex-col justify-center items-center grid-child-3 rounded-md bg-green-300/20 " + (properties.reverbWet > 0 ? "bg-green-300/20" : "passive-bg") + " children:(p-1)"}>
			<h1 class="text big-text">Reverb</h1>
			<h2 class="text">Decay: {properties.reverbDecay}</h2>
			<input class="" type="range" min="0.01" max="10" step="0.10" {disabled} bind:value={properties.reverbDecay} on:change={() => {updateValue("reverbDecay", properties.reverbDecay)}}>
			<h2 class="text">Active amount: {properties.reverbWet}</h2>
			<input class="" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.reverbWet} on:change={() => {updateValue("reverbWet", properties.reverbWet)}}>
		</div>
		<div class="flex flex-col justify-center items-center grid-child-4 rounded-md bg-green-300/20 children:(p-1)">
			<h1 class="text big-text">Media Settings</h1>
			<h2 class="text">Volume: {properties.volume}</h2>
			<input class="mb-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.volume} on:change={() => {updateValue("volume", properties.volume)}}>
			<h2 class="text">Playback rate: {properties.playbackRate}x</h2>
			<input class="mb-2" type="range" min="0" max="2" step="0.05" {disabled} bind:value={properties.playbackRate} on:change={() => {updateValue("playbackRate", properties.playbackRate)}}>
			<button class="button" {disabled} on:click={() => {sendMessage({message: "toggle-media"}, "Played/paused.")}}>Play/Pause</button>
		</div>
		<div class="flex flex-col justify-end grid-child-5 children:(p-1)">
			<p class="text">{status}</p>
			<button class="button" on:click={exitOptions}>Quit</button>
		</div>
	</div>
</div>

<style>
	.text {
		@apply text-sm text-light-600;
	}

	.big-text {
		@apply text-lg text-center;
	}

	.passive-bg {
		@apply bg-green-300/5;
	}

	.button {
		@apply w-24 p-2 m-2 bg-red-200 rounded-sm active:(ring-4 ring-light-200/25);
	}

	.grid-test {
		display: grid;
		grid-template-columns: repeat(2, 1fr) repeat(2, 0.75fr);
		grid-template-rows: repeat(3, 0.5fr);
	}

	.grid-child-1 {
		grid-area: 1 / 1 / 3 / 3;
	}

	.grid-child-2 {
		grid-area: 1 / 3 / 2 / 5;
	}

	.grid-child-3 {
		grid-area: 2 / 3 / 3 / 5;
	}

	.grid-child-4 {
		grid-area: 3 / 3 / 4 / 5;
	}

	.grid-child-5 { 
		grid-area: 3 / 1 / 4 / 3; 
	}


	.background-animate {
		background-size: 400%;
		-webkit-animation: bg-animation 40s ease infinite;
		-moz-animation: bg-animation 40s ease infinite;
		animation: bg-animation 40s ease infinite;
	}
	@keyframes bg-animation {
		0%,
		100% {
		background-position: 0% 50%;
		}
		50% {
		background-position: 100% 50%;
		}
	}
</style>