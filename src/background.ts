import { getStorage, setStorage, clearStorage, getValuesFromStorage, executeScript, sleep, exitCleanUp, setPersistentStorage } from "$lib/util/util";
import { getTab, removeTab, getActiveTab, openRecordTab, exitRecordTab, sendTabCommand, sendContentTabCommand } from "$lib/util/handleTab";
import { presets, messages } from "$lib/data";
import type { ContentProperty, ContentCommand, OptionalProperties, AnyResponse } from "$lib/types";

async function getValue(type: ContentProperty) {
	return await sendContentTabCommand({command: "GET_VALUE", type}).then((res) => {return res?.value});
}

async function getPlayerValues() {
	return {
		volume: await getValue("volume"),
		playbackRate: await getValue("playbackRate"),
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

async function alreadyRecording() {
	let response: AnyResponse = {
		pitch: 0,
		pitchWet: 0,
		reverbDecay: 0,
		reverbWet: 0
	}
	response = await getValuesFromStorage(response);
	// const {volume, playbackRate} = await getPlayerValues();
	response.message = messages.STATUS_ALREADY_PLAYING;
	response.volume = await getStorage("volume");
	response.playbackRate = await getStorage("playbackRate");
	return response;
}

async function runMixer() {
	const contentTab: chrome.tabs.Tab = await getActiveTab();
	const recordTabId = await getStorage("recordTab");
	const recordTab = (recordTabId) ? await getTab(recordTabId) : null;
	await setStorage("contentTab", contentTab.id);
	await setStorage("contentTabURL", contentTab.url);
	if (!contentTab?.audible) {
		return {message: messages.STATUS_NO_AUDIO_CONTENT};
	}
	if (!recordTab) {
		await executeContent();
		return await startRecording();
	}
	if (!recordTab?.audible) {
		console.warn(messages.CAPTURE_ERROR, messages.GITHUB_ISSUE);
		return {message: messages.STATUS_RECORD_FAILED};
	}
	return await alreadyRecording();
}

async function getAllStorage(type: string) {
	let data;
	if (type === "session") {
		console.log("BG: session storage", await chrome.storage.session.get(null));
	} else {
		console.log("BG: local storage", await chrome.storage.local.get(null));
	}
}

async function pageChange(url: string) {
	const res = await sendContentTabCommand({command: "PING"}, false)
	const volume = await getStorage("volume");
	const playbackRate = await getStorage("playbackRate");
	await setStorage("contentTabURL", url);
	if (res?.message !== "PONG") {
		await setStorage("contentExecuted", false);
		await setStorage("pageChange", true);
		await executeContent();
	}
	await sendContentTabCommand({command: "PAGE_CHANGE", volume, playbackRate});
}

function init() {
	chrome.runtime.onInstalled.addListener(async () => {
		await clearStorage();
		chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
		await setPersistentStorage("presets", presets);
		await getAllStorage("session");
		await getAllStorage("local");
	});

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.command === "START_MIXER") {
			runMixer().then((res) => {
				sendResponse(res);
			});
			return true;
		}
		if (request.command === "EXIT_MIXER") {
			exitRecordTab().then((res) => {
				sendResponse(res);
			});
			return true;
		}
		if (["GET_VALUE", "SET_VALUE", "TOGGLE_PLAYBACK"].includes(request.command)) {
			sendContentTabCommand(request).then((res) => {
				sendResponse(res);
			});
			return true;
		}
	});

	chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
		const contentTabId = await getStorage("contentTab");
		if (details.tabId === contentTabId && details.frameType === "outermost_frame") {
			console.log("BG new dom loaded: ", details);
			await pageChange(details.url);
		}
	});

	chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, url }) => {
		const contentTabId = await getStorage("contentTab");
		const contentTabURL = await getStorage("contentTabURL");
		if (tabId === contentTabId && url !== contentTabURL) {
			chrome.tabs.onUpdated.addListener(async function update(tabId, changeInfo) {
				if (tabId === contentTabId && changeInfo.title) {
					await pageChange(url);
					chrome.tabs.onUpdated.removeListener(update);
				}
			});
		}
	});
	
	chrome.tabs.onRemoved.addListener(async (tabId) => {
		const contentTabId = await getStorage("contentTab");
		const recordTabId = await getStorage("recordTab");
		if (tabId === contentTabId) {
			await exitRecordTab();
			await exitCleanUp();
		}

		if (tabId === recordTabId) {
			await sendContentTabCommand({command: "SET_VALUE", type: "playbackRate", value: 1});
			await exitCleanUp();
		}
	});
}

init();
