<script>
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
            		properties[key] = value
					if (scope === "global") {
						updateValue(String(key), value)
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
			if (response.message === "Playing" || response.message === "Already playing") {
				disabled = false;
				updateValues(response, "local");
			}
			status = response.message;
		})
	}

</script>

<div class="flex flex-col w-full h-auto opacity-80 bg-gradient-to-tr from-orange-600 via-pink-600 to-purple-700 background-animate blur">
<div class="flex flex-row children:(flex flex-col pl-2)">	
	<div class="min-w-[50%] pl-5">
		<h1 class="text">Presets:</h1>
		{#each presets as preset, i}
			<div class="flex flex-row items-center hover:(bg-gray-400/20)" on:click={() => {
				setPreset(i);
				updateValues(presets[activePreset].values, "global");}}>
				<input class="" type="radio" name="activePreset" bind:group={activePreset} value={i}>
				<span class="text">{preset.name}</span>
			</div>
		{/each}
	</div>
	<div class="min-w-[50%] mr-4">
		<h1 class="text">Playback rate: {properties.playbackRate}x</h1>
		<input class="m-2" type="range" min="0" max="2" step="0.05" {disabled} bind:value={properties.playbackRate} on:change={() => {updateValue("playbackRate", properties.playbackRate)}}>
		<h1 class="text text-center">Pitch</h1>
		<div class="flex flex-row children:min-w-1/2">
			<div class="flex flex-col">
			<h2 class="text">Semitone Shift: {properties.pitch}</h2>
			<input class="m-2" type="range" min="-12" max="12" step="1" {disabled} bind:value={properties.pitch} on:change={() => {updateValue("pitch", properties.pitch)}}>
			</div>
			<div class="flex flex-col">
			<h2 class="text">Wetness: {properties.pitchWet}</h2>
			<input class="m-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.pitchWet} on:change={() => {updateValue("pitchWet", properties.pitchWet)}}>
			</div>
		</div>
		<h1 class="text text-center">Reverb</h1>
		<div class="flex flex-row children:min-w-1/2">
			<div class="flex flex-col">
			<h2 class="text">Decay: {properties.reverbDecay}</h2>
			<input class="m-2" type="range" min="0.01" max="10" step="0.10" {disabled} bind:value={properties.reverbDecay} on:change={() => {updateValue("reverbDecay", properties.reverbDecay)}}>
			</div>
			<div class="flex flex-col">
				<h2 class="text">Wetness: {properties.reverbWet}</h2>
				<input class="m-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.reverbWet} on:change={() => {updateValue("reverbWet", properties.reverbWet)}}>
			</div>
		</div>
		<h1 class="text">Volume: {properties.volume}</h1>
		<input class="m-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.volume} on:change={() => {updateValue("volume", properties.volume)}}>
		<button class="p-2 m-2 bg-red-200" {disabled} on:click={() => {sendMessage({message: "toggle-media"}, "Played/paused.")}}>Play/Pause</button>
		</div>
	</div>
	<div class="flex flex-row pt-5 pl-3">
	<p class="text">{status}</p>
	<button class="w-24 p-2 m-2 bg-red-200" on:click={exitOptions}>Quit</button>
	</div>
</div>

<style>
	.text {
		@apply text-sm text-light-600 p-2
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