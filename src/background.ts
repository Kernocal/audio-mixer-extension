import { getStorage, setStorage, clearStorage, getValuesFromStorage, executeScript, sleep, exitCleanUp } from "$lib/util/util";
import { getActiveTab, getTab, openRecordTab, removeTab, sendTabCommand } from "$lib/util/handleTab";
import { messages } from "$lib/data";
import type { ContentProperty, ContentCommand, OptionalProperties } from "$lib/types";

var URL_CHANGED: boolean = false;
var PAGE_LOADED: boolean = false;
var PAGE_FULLY_LOADED: boolean = false;
var NEW_PAGE: boolean = false;
var CONTENT_RELOAD_ONCE: boolean = false;

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
	await setStorage("contentTabURL", contentTab.url);
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
			await getAllStorage();

			// refresh 
			let response: OptionalProperties = {
				playbackRate: 0,
				pitch: 0,
				pitchWet: 0,
				reverbDecay: 0,
				reverbWet: 0
			}
			response = await getValuesFromStorage(response);
			// console.log("BG vol: player", await getValue("volume"), "storage", await getStorage("volume"));
			let res = {
				message: messages.STATUS_ALREADY_PLAYING,
				volume: await getValue("volume") ?? await getStorage("volume"),
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

async function getAllStorage() {
	const data = await chrome.storage.local.get(null);
	console.log("BG: current storage", data);
}

async function pageChange(url: string, execute = false) {
		console.log("BG page change: old url", await getStorage("contentTabURL"), "new url", url);
		await setStorage("contentTabURL", url);
		const volume = await getStorage("volume");
		const playbackRate = await getStorage("playbackRate");
		console.log("BG: setting volume,", volume, "playbackRate", playbackRate);
		if (execute) {
			let res;
			try {
				res = await chrome.tabs.sendMessage(await getStorage("contentTab"), {command: "PING"});
			} catch (e) {}
			console.log("BG ping result", res);
			if (res?.message !== "PONG") {
				console.log("BG: executing content script.");
				await setStorage("contentExecuted", false);
				await executeContent();
			}
		}
		const res = await sendContentTabCommand({command: "PAGE_CHANGE", volume, playbackRate});
}

function init() {
	chrome.runtime.onInstalled.addListener(async () => {
		await clearStorage();
		await getAllStorage();
	});

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

	chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
		// works for refresh, cross domain, non SPA.
		const contentTabId = await getStorage("contentTab");
		const contentTabURL = await getStorage("contentTabURL");
		if (details.tabId === contentTabId && details.frameType === "outermost_frame") {
			console.log("BG new dom loaded: ", details);
			// cross domain
			if (details.url !== contentTabURL) {
				// uninjected: re execute set values, set flag to read instead of set.
				// injected: set values, set flag to read instead of set.
				await pageChange(details.url, true);
			} else {
				// refresh,
				// uninjected: re execute, set values.
				// injected: set values, set flag to read values instead of set. 
				// await pageChange(details.url, true);
			}
		}
	});

	chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
		// moving page SPA likely playing while moving!
		const contentTabId = await getStorage("contentTab");
		const contentTabURL = await getStorage("contentTabURL");
		// console.log("BG url stored", contentTabURL, "url state updated", details?.url);
		if (details?.tabId === contentTabId) {
			console.log("BG new history on contentTab:", details);
			if (NEW_PAGE) {
				NEW_PAGE = false;
				// uninjected: sometimes re execute, set flag to use storage values.
				// injected: set flag to use storage values instead of setting.
				// very fast sleepy
				chrome.tabs.onUpdated.addListener(async function z(tabId, changeInfo, tab) {
					if (tabId === contentTabId) {
						console.log("Content tab status complete", changeInfo, tab);
						if (changeInfo.title) {
							// await pageChange(details.url, true);
							chrome.tabs.onUpdated.removeListener(z);
						}
					}
				})
			} else if (details?.url === contentTabURL) {
				// current page set to prev history, next update will be new url.
				NEW_PAGE = true;
			}
		}

	});
	
	// chrome.webNavigation.onCommitted.addListener(async (details) => {
		// const contentTabId = await getStorage("contentTab");
		// const contentTabURL = await getStorage("contentTabURL");
		// // && details?.frameType === "outermost_frame"
		// if (details?.tabId === contentTabId) {
		// 	console.log("BG onCommitted: ", details);
		// 	if (details?.transitionType === "reload") {
		// 		console.log("BG onCommitted refresh: ", details);
				// await pageChange(details.url, true);
				// chrome.webNavigation.onCompleted.addListener(async function pageChange() {
				// 	chrome.webNavigation.onCompleted.removeListener(pageChange);
				// });
			// }
		// }
	// });

	// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		// const contentTabId = await getStorage("contentTab");
		// if (tabId === contentTabId) {
		// 	// console.log("Active tab updated!", changeInfo, "tab id:", tab?.id);
		// 	URL_CHANGED = (changeInfo?.url && changeInfo?.status) ? true : URL_CHANGED;
		// 	PAGE_LOADED = (URL_CHANGED && changeInfo?.status == "complete") ? true : PAGE_LOADED;
		// 	PAGE_FULLY_LOADED = (PAGE_LOADED && changeInfo?.title) ? true : PAGE_FULLY_LOADED;
		// 	if (URL_CHANGED && PAGE_LOADED && PAGE_FULLY_LOADED) {
		// 		URL_CHANGED = false;
		// 		PAGE_LOADED = false;
		// 		PAGE_FULLY_LOADED = false;
		// 		console.log("BG: page change, ", changeInfo.title);
		// 		const volume = await getStorage("volume");
		// 		const playbackRate = await getStorage("playbackRate");
		// 		const res = await sendContentTabCommand({command: "PAGE_CHANGE", volume, playbackRate});
		// 	}
		// }
	// });
	
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
