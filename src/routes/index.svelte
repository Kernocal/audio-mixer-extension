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
			if (response.message === "Playing" || response.message === "Already playing") {
				disabled = false;
				updateValues(response, "local");
			}
			status = response.message;
		})
	}
	// disabled = false;

</script>

<div class="flex flex-col w-[600px] opacity-80 bg-gradient-to-tr from-orange-600 via-pink-600 to-purple-700 background-animate blur">
	<div class="flex flex-row children:(flex flex-col pl-2)">
		<div class="min-w-[50%] pl-2 children:rounded-md" use:draggable>
			<h1 class="text-center text big-text">Audio Presets:</h1>
			{#each presets as preset, i}
				<div class={(activePreset === i ? "bg-green-300/20" : "") + " flex flex-row items-center hover:(bg-green-300/20)"} on:click={() => {
					setPreset(i);
					updateValues(presets[activePreset].values, "global");}}>
					<input class="ml-2 active:(bg-gray-400/20)" type="radio" name="activePreset" bind:group={activePreset} value={i}>
					<span class="text">{preset.name}</span>
				</div>
			{/each}
		</div>
		<div class="min-w-[50%] mr-4 children:(flex flex-col justify-end items-center m-2 rounded-md bg-green-300/20)">
			<div class={(properties.pitchWet > 0 ? "bg-green-300/20" : "passive-bg")} use:draggable>
				<h1 class="text big-text">Pitch</h1>
				<h2 class="text">Semitone Shift: {properties.pitch}</h2>
				<input class="" type="range" min="-12" max="12" step="1" {disabled} bind:value={properties.pitch} on:change={() => {updateValue("pitch", properties.pitch)}}>
				<h2 class="text">Active amount: {properties.pitchWet}</h2>
				<input class="mb-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.pitchWet} on:change={() => {updateValue("pitchWet", properties.pitchWet)}}>
			</div>
			<div class={(properties.reverbWet > 0 ? "bg-green-300/20" : "passive-bg")} use:draggable>
				<h1 class="text-center text big-text">Reverb</h1>
				<h2 class="text">Decay: {properties.reverbDecay}</h2>
				<input class="mb-2" type="range" min="0.01" max="10" step="0.10" {disabled} bind:value={properties.reverbDecay} on:change={() => {updateValue("reverbDecay", properties.reverbDecay)}}>
				<h2 class="text">Active amount: {properties.reverbWet}</h2>
				<input class="mb-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.reverbWet} on:change={() => {updateValue("reverbWet", properties.reverbWet)}}>
			</div>
			<div class="flex flex-col items-center justify-end m-2 rounded-md bg-green-300/20" use:draggable>
				<h1 class="text big-text">Media Settings</h1>
				<h2 class="text">Volume: {properties.volume}</h2>
				<input class="mb-2" type="range" min="0" max="1" step="0.01" {disabled} bind:value={properties.volume} on:change={() => {updateValue("volume", properties.volume)}}>
				<h2 class="text">Playback rate: {properties.playbackRate}x</h2>
				<input class="mb-2" type="range" min="0" max="2" step="0.05" {disabled} bind:value={properties.playbackRate} on:change={() => {updateValue("playbackRate", properties.playbackRate)}}>
				<button class="w-24 p-2 m-2 bg-red-200 rounded-sm active:(ring-4 ring-light-200/25)" {disabled} on:click={() => {sendMessage({message: "toggle-media"}, "Played/paused.")}}>Play/Pause</button>
			</div>
		</div>
	</div>
	<div class="flex flex-row justify-between pt-5 pl-3">
		<p class="text">{status}</p>
		<button class="w-24 p-2 m-2 bg-red-200 rounded-sm active:(ring-4 ring-light-200/25)" on:click={exitOptions}>Quit</button>
	</div>
</div>

<style>
	.text {
		@apply text-sm text-light-600 p-2;
	}

	.big-text {
		@apply text-lg;
	}

	.passive-bg {
		@apply bg-green-300/5;
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