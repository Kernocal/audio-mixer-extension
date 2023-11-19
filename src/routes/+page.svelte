<script lang="ts">
	import { onMount } from 'svelte';
	import { getStorage, setStorage, getPersistentStorage, setPersistentStorage, compareObjects } from '$lib/util/util';
	import { presets, messages } from '$lib/data';
	import Knob from '$lib/webaudio-knob/Knob.svelte'
	import SmallKnobSrc from '$lib/assets/SmallLedKnob2.png'
	import CarbonKnobSrc from '$lib/assets/CarbonPurple.png'
	import GitHub from '$lib/assets/github.png';

	import type { Properties, PopUpCommands, Property, PresetProperties, StartMixerResponse, Preset } from '$lib/types';

	let STATUS: string = messages.STATUS_WAITING;
	let PRESETS: Preset[] = [];
	let UI_DISABLED: boolean = true;
	let ACTIVE_PRESET_INDEX: number = 0;
	let SAVE_PRESET_HIDDEN = true;
	let NEW_PRESET_NAME = "";
	let PROPERTIES: Properties = {
		pitch: 0, 
		pitchWet: 0, 
		reverbDecay: 0.01, 
		reverbWet: 0, 
		volume: 0, 
		playbackRate: 1
	}

	function sendCommand(data: PopUpCommands, text: string) {
		try {
			chrome.runtime.sendMessage(data, response => {
				if (response?.message === 'success') {
					STATUS = text;
				} else {
					STATUS = messages.STATUS_FAILED_COMMAND;
				}
			});
		} catch (e) {
			console.warn(e);
		}
	}

	function setPreset(presetIndex: number) {
		ACTIVE_PRESET_INDEX = presetIndex;
		setStorage("preset", ACTIVE_PRESET_INDEX);
	}

	async function savePreset() {
		PRESETS = await getPersistentStorage("presets");
		const {volume, ...newProperties} = PROPERTIES;
		const newPreset = {name: NEW_PRESET_NAME, values: (newProperties as PresetProperties)};
		PRESETS.splice((PRESETS.length - 1), 0, newPreset);
		await setPersistentStorage("presets", PRESETS);
		NEW_PRESET_NAME = "";
	}

	async function deletePreset(presetIndex: number) {
		PRESETS = await getPersistentStorage("presets");
		if (presetIndex !== 0 || presetIndex !== PRESETS.length - 1) {
			PRESETS.splice(presetIndex, 1);
			await setPersistentStorage("presets", PRESETS);
			setValues(PRESETS[0].values, "GLOBAL");
		}
	}

	function getPresetIndexFromProperties() {
		//If no valid preset found set to the last preset, custom.
		const customIndex = PRESETS.length - 1;
		const presetProperties = (({ volume, ...key}) => key)(PROPERTIES);
		for (var i = 0; i < customIndex; i++) {
			if (compareObjects(PRESETS[i].values, presetProperties)) {
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
				const presetValues = PRESETS[ACTIVE_PRESET_INDEX].values;
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
	
	onMount(async () => {
		PRESETS = await getPersistentStorage("presets");
		if (PRESETS.length < 1) {
			STATUS = messages.STATUS_PRESETS_EMPTY;
			console.warn(messages.GITHUB_ISSUE);
			PRESETS = presets;
		}
		console.log("presets", PRESETS);
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
	});

</script>

<div class="w-fit h-fit min-w-[500px] min-h-[550px] whitespace-nowrap animate flex flex-col">
	<a title="Get help on GitHub!" class="ml-auto w-fit hover:opacity-75" href="https://github.com/Kernocal/audio-mixer-extension" target="_blank">
		<img src={GitHub} alt="" class="filter-svg max-w-6 max-h-6 min-w-6 min-h-6 mt-2 mr-2 float-right"/>
	</a>
	<div class="grid-parent justify-evenly items-center children:m-2">
		<div class="grid-child1 flex flex-col pl-2 pb-2 pt-1 children:(rounded-md)">
			<h1 class="big-text">Presets</h1>
			{#each PRESETS as preset, i}
				<label class={"font-medium cursor-pointer mb-1 p-2 pr-4 hover:(bg-mixer-secondary/30) " + (ACTIVE_PRESET_INDEX === i && !UI_DISABLED ? "bg-mixer-secondary/30" : "bg-mixer-secondary/10")}>
					<input class="radio mx-2 mt-auto" type="radio" name="activePreset" disabled={UI_DISABLED} bind:group={ACTIVE_PRESET_INDEX} value={i} on:click={() => {
						setPreset(i);
						setValues(PRESETS[ACTIVE_PRESET_INDEX]?.values, "GLOBAL");}}>
					<span class="text-sm text-light-600 m-auto">{preset.name}</span>
				</label>
			{/each}
			{#if !SAVE_PRESET_HIDDEN}
				<div class="animate fixed w-fit flex flex-col justify-center items-center p-3">
					<input type="text" name="" id="" class="p-2 m-2 w-32" bind:value={NEW_PRESET_NAME}>
					<div>
					<button class="button" on:click={() => {
						savePreset();
						SAVE_PRESET_HIDDEN = !SAVE_PRESET_HIDDEN
						}}>save</button>
					<button class="button" on:click={() => {
						SAVE_PRESET_HIDDEN = !SAVE_PRESET_HIDDEN;
						NEW_PRESET_NAME = "";
						}}>cancel</button>
					</div>
				</div>
			{/if}
			{#if PRESETS[ACTIVE_PRESET_INDEX]?.name === "Custom"}
			<button class="button pt-1" disabled={UI_DISABLED} on:click={() => {SAVE_PRESET_HIDDEN = !SAVE_PRESET_HIDDEN;}}>Save preset</button>
			{:else}
			<button class="button pt-1" disabled={UI_DISABLED || ACTIVE_PRESET_INDEX === 0} on:click={async () => {await deletePreset(ACTIVE_PRESET_INDEX);}}>Delete preset</button>
			{/if}
			<div class="flex flex-row justify-between">
				<div class="flex flex-col children:(p-1) text">
					<p class={`text-light-600 p-1 w-fit whitespace-pre-line ${(STATUS.length > 80 ? "text-xs" : "text-sm")}`}>{STATUS}</p>
					<button class="button" on:click={exitMixer}>Quit</button>
				</div>
			</div>
		</div>
		<div class="grid-child2">
		<div class={"rounded-md " + (PROPERTIES.pitchWet > 0 ? "bg-mixer-secondary/30" : "bg-mixer-secondary/10")}>
			<h1 class="propertyText">Pitch</h1>
			<div class="flex justify-around">
			<Knob id="pitch" label="Semitone Shift:" src={SmallKnobSrc} bind:value={PROPERTIES.pitch} min="-12" max="12" step="1" disabled={UI_DISABLED} on:change={() => {setValue("pitch", PROPERTIES.pitch)}}/>
			<Knob id="pitchWet" label="Active amount:" src={CarbonKnobSrc} bind:value={PROPERTIES.pitchWet} min="0" max="1" step="0.01" disabled={UI_DISABLED} on:change={() => {setValue("pitchWet", PROPERTIES.pitchWet)}}/>
			</div>
		</div>
		<div class={"rounded-md mt-2 " + (PROPERTIES.reverbWet > 0 ? "bg-mixer-secondary/30" : "bg-mixer-secondary/10")}>
			<h1 class="propertyText">Reverb</h1>
			<div class="flex justify-around">
			<Knob id="reverb" label="Decay:" src={SmallKnobSrc} bind:value={PROPERTIES.reverbDecay} min="0.01" max="10" step="0.10" disabled={UI_DISABLED} on:change={() => {setValue("reverbDecay", PROPERTIES.reverbDecay)}}/>
			<Knob id="reverbWet" label="Active amount:" src={CarbonKnobSrc} bind:value={PROPERTIES.reverbWet} min="0" max="1" step="0.01" disabled={UI_DISABLED} on:change={() => {setValue("reverbWet", PROPERTIES.reverbWet)}}/>
			</div>
		</div>
		<div class="rounded-md bg-mixer-secondary/30 whitespace-nowrap mt-2">
			<h1 class="propertyText">Media Settings</h1>
			<div class="flex">
				<button class="button self-end" disabled={UI_DISABLED} on:click={() => {sendCommand({command: "TOGGLE_PLAYBACK"}, messages.STATUS_TOGGLE_PLAYBACK)}}>Play/Pause</button>
				<Knob id="volume" label="Volume:" src={SmallKnobSrc} bind:value={PROPERTIES.volume} min="0" max="1" step="0.01" disabled={UI_DISABLED} on:change={() => {setValue("volume", PROPERTIES.volume)}}/>
				<Knob id="playbackRate" label="Playback Rate:" src={SmallKnobSrc} bind:value={PROPERTIES.playbackRate} min="0.1" max="2" step="0.05" disabled={UI_DISABLED} on:change={() => {setValue("playbackRate", PROPERTIES.playbackRate)}}/>
			</div>
		</div>
		</div>
	</div>
</div>


<style>
	:global(body) {
		@apply scrollbar scrollbar-rounded scrollbar-w-8px scrollbar-radius-8 scrollbar-thumb-color-mixer-primary scrollbar-track-color-mixer-secondary;
	}

	.radio {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		margin: 0;
		@apply rounded-[9999px] border-purple-900;
		height: 1rem;
		width: 1rem;
		border-radius: 9999px;
		border-width: 1px;
	}
	.radio:checked {
		@apply bg-purple-600 shadow-purple;
	}

	.radio:disabled, .radio:active:disabled {
		@apply bg-transparent border-dark-950;
	}

	.text {
		@apply text-light-600 text-sm p-1;
	}
	.big-text {
		@apply text-light-600 text-lg text-center font-medium;
	}
	.propertyText {
		@apply text-light-600 text-lg p-1 pl-2 font-medium;
	}

	.button {
		@apply w-fit h-fit p-2 m-2 bg-purple-700 rounded-md text-white;
	}
	.button:active:enabled {
		@apply ring-4 ring-light-200/25;
	}
	.button:hover:enabled {
		@apply opacity-80;
	}
	.button:disabled {
		@apply bg-purple-950/20 cursor-not-allowed;
	}

	.grid-parent {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}
	.grid-child1 { 
		grid-area: 1 / 1 / 2 / 2; 
	}
	.grid-child2 { 
		grid-area: 1 / 2 / 2 / 3; 
	}

	.filter-svg {
		filter: invert(14%) sepia(65%) saturate(6557%) hue-rotate(272deg) brightness(89%) contrast(91%);
	}

	.animate {
		background-color: rgb(0, 2, 19, 0.92);
		animation: bg-animation 60s infinite linear;
	}

	@keyframes bg-animation {
		0%   { background-color: rgba(0, 1, 20, 0.92); }
		60%   { background-color: rgba(17, 0, 31, 0.92); }
		40%   { background-color: rgba(0, 43, 10, 0.92); }
		20%   { background-color: rgba(31, 0, 0, 0.92); }
		80%   { background-color: rgba(1, 0, 63, 0.92); }
		100%   { background-color: rgba(43, 23, 0, 0.92); }
	}

</style>
