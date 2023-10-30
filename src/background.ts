import { getStorage, setStorage, clearStorage, getValuesFromStorage, executeScript, sleep } from "$lib/util/util";
import { getActiveTab, getTab, openRecordTab, removeTab, sendTabCommand } from "$lib/util/handleTab";
import { messages } from "$lib/data";
import type { ContentProperty, ContentCommand, OptionalProperties } from "$lib/types";

var URL_CHANGED: boolean = false;
var PAGE_LOADED: boolean = false;
var PAGE_FULLY_LOADED: boolean = false;

async function sendContentTabCommand(data: ContentCommand) {
	const tabId = await getStorage("contentTab");
	return await sendTabCommand(tabId, data);
}

async function getValue(type: ContentProperty) {
	return await sendContentTabCommand({command: "GET_VALUE", type}).then((res) => {return res?.value});
}

function setValue(type: ContentProperty, value: number) {
	return sendContentTabCommand({command: "SET_VALUE", type, value});
}

async function getPlayerValues() {
	return {
		volume: getValue("volume"),
		playbackRate: getValue("playbackRate"),
	};
}

async function executeContent() {
	const contentTabId = await getStorage("contentTab");
	await executeScript(contentTabId, "scripts/content.js");
	await sleep(500);
}

async function startRecording() {
	const recordTab = await openRecordTab();
	if (recordTab) {
		await setStorage("recordTab", recordTab.id);
		await sleep(500);
		await sendTabCommand(recordTab.id as number, {command: "START_RECORDING"});
		let res = {
			message : messages.STATUS_PLAYING,
			volume: await getValue("volume"),
			playbackRate: await getValue("playbackRate")
		};
		console.log("BG recording: ", res);
		return res;
	}
}

async function runMixer() {
	const contentTab: chrome.tabs.Tab = await getActiveTab();
	await setStorage("contentTab", contentTab.id);
	if (contentTab?.audible) {
		const recordTabId = await getStorage("recordTab");
		const recordTab = (recordTabId) ? await getTab(recordTabId) : undefined;
		if (!recordTab) {
			await executeContent();
			return await startRecording();
		} else {
			if (!recordTab?.audible) {
				console.warn(messages.CAPTURE_ERROR, messages.GITHUB_ISSUE);
				return {message: messages.NO_RECORD_AUDIO};
			}
			//Already playing, get properties from storage other than volume as user may have changed it.
			let response: OptionalProperties = {
				playbackRate: 0,
				pitch: 0,
				pitchWet: 0,
				reverbDecay: 0,
				reverbWet: 0
			}
			response = await getValuesFromStorage(response);
			let res = {
				message: messages.STATUS_ALREADY_PLAYING,
				volume: await getValue("volume"),
				...response
			};
			console.log("BG already: ", res);
			return res;
		}
	} else {
		return {message: messages.STATUS_NO_AUDIO_CONTENT};
	}
}

async function exitRecordTab() {
	const recordTabId = await getStorage("recordTab");
	const result = (recordTabId) ? await removeTab(recordTabId) : undefined;
	if (result) {
		return {message: messages.STATUS_QUIT};
	}
}

function init() {
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.command === "START_MIXER") {
			runMixer().then((response) => {
				sendResponse(response);
			})
			return true
		}
		if (request.command === "EXIT_MIXER") {
			exitRecordTab().then((result) => {sendResponse(result)})
			return true
		}
		if (request.command === "TOGGLE_PLAYBACK" || ["playbackRate", "volume"].includes(request.type)) {
			sendContentTabCommand(request).then((result) => {sendResponse(result);})
			return true
		}
	});
	
	chrome.runtime.onInstalled.addListener(() => {
		chrome.storage.local.get(null).then((data) => {
			console.log("BG: current storage", data);
		})
	});
	
	chrome.tabs.onRemoved.addListener(async (tabId) => {
		const contentTabId = await getStorage("contentTab");
		const recordTabId = await getStorage("recordTab");

		if (tabId === contentTabId || tabId === recordTabId) {
			await exitRecordTab();
			await sendContentTabCommand({command: "SET_VALUE", type: "playbackRate", value: 1});
			await clearStorage();
			console.log(messages.EXITING);
		}
	});
}

init();
