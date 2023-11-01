<script lang="ts">
	import { browser } from '$app/environment';
	import { getStorage, setStorage, compareObjects } from '$lib/util/util';
	import { presets, messages } from '$lib/data';
	import GitHub from '$lib/assets/github.png';

	import type { Properties, PopUpCommands, Property, PresetProperties, StartMixerResponse } from '$lib/types';

	let STATUS: string = messages.STATUS_WAITING;
	let UI_DISABLED: boolean = true;
	let ACTIVE_PRESET_INDEX: number = 0;
	let PROPERTIES: Properties = {
		pitch: 0, 
		pitchWet: 0, 
		reverbDecay: 0.01, 
		reverbWet: 0, 
		volume: 0, 
		playbackRate: 0
	}

	function sendCommand(data: PopUpCommands, text: string) {
		chrome.runtime.sendMessage(data, response => {
			if (response?.message === 'success') {
				STATUS = text;
			} else {
				STATUS = messages.STATUS_FAILED_COMMAND;
			}
		});
	}

	function setPreset(presetIndex: number) {
		ACTIVE_PRESET_INDEX = presetIndex;
		setStorage("preset", ACTIVE_PRESET_INDEX);
	}

	function getPresetIndexFromProperties() {
		//If no valid preset found set to the last preset, custom.
		const customIndex = presets.length - 1;
		const presetProperties = (({ volume, ...key}) => key)(PROPERTIES);
		for (var i = 0; i < customIndex; i++) {
			if (compareObjects(presets[i].values, presetProperties)) {
				return i
			}
		}
		return customIndex;
	}

	function getUpdatedStatus(property: Property) {
		// Splits on capital letter: playbackRate -> ['playback', 'Rate'] 
		const properties = property.split(/(?=[A-Z])/);
		if (properties.length > 1) {
			return `Updated ${properties[0]} ${properties[1].toLowerCase()}.`;
		} else {
			return `Updated ${properties[0]}.`;
		}
	}

	function setValue(property: Property, value: number) {
		if (!UI_DISABLED) {
			sendCommand({
				command: "SET_VALUE",
				type: property,
				value
			}, getUpdatedStatus(property));
			if (property !== "volume") {
				const presetValues = presets[ACTIVE_PRESET_INDEX].values;
				if ((presetValues as PresetProperties)[property] !== value) {
					const presetIndex = getPresetIndexFromProperties();
					setPreset(presetIndex);
				}
			}
		}
	}

	function setValues(newValues: StartMixerResponse|{}, scope: "LOCAL"|"GLOBAL") {
		for (let [objKey, objValue] of Object.entries(newValues)) {
			let key: Property = (objKey as Property);
			let value: number = (objValue as number);
    	    if (PROPERTIES.hasOwnProperty(key)) {
            	PROPERTIES[key] = value;
				if (scope === "GLOBAL") {
					setValue(key, value);
				}
			}
		}
    }

	function exitMixer() {
		PROPERTIES.playbackRate = 1;
		setValue("playbackRate", PROPERTIES.playbackRate);
		sendCommand({command: "EXIT_MIXER"}, messages.STATUS_EXIT);
		window.close();
	}
	
	if (browser) {
		getStorage("preset").then((storedPreset) => {
			ACTIVE_PRESET_INDEX = storedPreset ?? ACTIVE_PRESET_INDEX;
		});
		chrome.runtime.sendMessage({command: "START_MIXER"}, (response) => {
			if (["Playing.", "Already playing."].includes(response.message)) {
					UI_DISABLED = false;
					setValues(response, "LOCAL");
			}
			STATUS = response.message;
		});
	}

</script>

<div class="min-w-[400px] min-h-[500px] opacity-80 bg-gradient-to-tr from-orange-600 via-pink-600 to-purple-700 background-animate">
	<div class="grid-main children:(m-2)">
		<div class="flex flex-col grid-child-1 bg-green-300/20 rounded-sm children:(rounded-md)">
			<h1 class="text big-text">Audio Presets:</h1>
			{#each presets as preset, i}
				<label class={(ACTIVE_PRESET_INDEX === i ? "bg-green-300/20" : "") + " mb-1 p-2 hover:(bg-green-300/20)"}>
					<input class="ml-2 active:(bg-gray-400/20)" type="radio" name="activePreset" disabled={UI_DISABLED} bind:group={ACTIVE_PRESET_INDEX} value={i} on:click={() => {
						setPreset(i);
						setValues(presets[ACTIVE_PRESET_INDEX].values, "GLOBAL");}}>
					<span class="text-sm text-light-600">{preset.name}</span>
				</label>
			{/each}
		</div>
		<div class={"flex flex-col justify-center items-center grid-child-2 rounded-md bg-green-300/20 " + (PROPERTIES.pitchWet > 0 ? "bg-green-300/20" : "passive-bg")}>
			<h1 class="text big-text">Pitch</h1>
			<h2 class="text">Semitone Shift: {PROPERTIES.pitch}</h2>
			<input class="" type="range" min="-12" max="12" step="1" disabled={UI_DISABLED} bind:value={PROPERTIES.pitch} on:change={() => {setValue("pitch", PROPERTIES.pitch)}}>
			<h2 class="text">Active amount: {PROPERTIES.pitchWet}</h2>
			<input class="" type="range" min="0" max="1" step="0.01" disabled={UI_DISABLED} bind:value={PROPERTIES.pitchWet} on:change={() => {setValue("pitchWet", PROPERTIES.pitchWet)}}>
		</div>
		<div class={"flex flex-col justify-center items-center grid-child-3 rounded-md bg-green-300/20 " + (PROPERTIES.reverbWet > 0 ? "bg-green-300/20" : "passive-bg")}>
			<h1 class="text big-text">Reverb</h1>
			<h2 class="text">Decay: {PROPERTIES.reverbDecay}</h2>
			<input class="py-1" type="range" min="0.01" max="10" step="0.10" disabled={UI_DISABLED} bind:value={PROPERTIES.reverbDecay} on:change={() => {setValue("reverbDecay", PROPERTIES.reverbDecay)}}>
			<h2 class="text">Active amount: {PROPERTIES.reverbWet}</h2>
			<input class="py-1" type="range" min="0" max="1" step="0.01" disabled={UI_DISABLED} bind:value={PROPERTIES.reverbWet} on:change={() => {setValue("reverbWet", PROPERTIES.reverbWet)}}>
		</div>
		<div class="flex flex-col justify-center items-center grid-child-4 rounded-md bg-green-300/20">
			<h1 class="text big-text">Media Settings</h1>
			<h2 class="text">Volume: {+PROPERTIES.volume.toFixed(2)}</h2>
			<input class="mb-2 py-1" type="range" min="0" max="1" step="0.01" disabled={UI_DISABLED} bind:value={PROPERTIES.volume} on:change={() => {setValue("volume", PROPERTIES.volume)}}>
			<h2 class="text">Playback rate: {PROPERTIES.playbackRate}x</h2>
			<input class="mb-2 py-1" type="range" min="0.1" max="2" step="0.05" disabled={UI_DISABLED} bind:value={PROPERTIES.playbackRate} on:change={() => {setValue("playbackRate", PROPERTIES.playbackRate)}}>
			<button class="button active:(ring-4 ring-light-200/25) hover:opacity-80" disabled={UI_DISABLED} on:click={() => {sendCommand({command: "TOGGLE_PLAYBACK"}, messages.STATUS_TOGGLE_PLAYBACK)}}>Play/Pause</button>
		</div>
		<div class="flex flex-row justify-between grid-child-5">
			<div class="flex flex-col self-end children:(p-1) text">
				<p class={`text-light-600 p-1 ${(STATUS.length > 80 ? "text-xs" : "text-sm")}`}>{STATUS}</p>
				<button class="button active:(ring-4 ring-light-200/25) hover:opacity-80" on:click={exitMixer}>Quit</button>
			</div>
			<a title="Get help on GitHub!" class="self-end hover:opacity-75" href="https://github.com/Kernocal/audio-mixer-extension" target="_blank">
				<img src={GitHub} alt="" class="float-right w-10 h-10 ml-2 filter-yellow-800"/>
			</a>
		</div>
	</div>
</div>

<style>
	.text {
		@apply text-sm text-light-600 p-1;
	}

	.big-text {
		@apply text-lg text-center;
	}

	.presetItem {
		@apply p-2;
	}

	.passive-bg {
		@apply bg-green-300/5;
	}

	.button {
		@apply w-24 p-2 m-2 bg-red-200 rounded-sm text-dark;
	}

	.grid-main {
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
		background-position: 100% 50%;
		}
		50% {
		background-position: 0% 50%;
		}
	}

</style>
