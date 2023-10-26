import { getStorage, setStorage, clearStorage, executeScript, sleep } from "$lib/util/util";
import { getActiveTab, getOptionsTab, openOptionTab, removeTab, sendMessageToTab } from "$lib/util/handleTab";

async function sendToActive(data) {
	return sendMessageToTab("activeTab", data)
}

async function exitOptions() {
	const optionTabId = await getStorage("optionTab");
	const result = await removeTab(optionTabId);
	clearStorage().then(() => {console.log("Cleared local storage.");});
	if (result) {
		return {message: "Quit connection."}
	}
}

async function runCode() {
	const activeTab: chrome.tabs.Tab = await getActiveTab();
	if (activeTab?.audible) {
		const tabId = await getStorage("optionTab");
		const optionTab = await getOptionsTab(tabId);
		if (!optionTab) {
			//Play and connect
			await setStorage("activeTab", activeTab.id);
			await executeScript(activeTab.id, "scripts/content.js");
			await sleep(500);

			const newOptionTab = await openOptionTab();
			await setStorage("optionTab", newOptionTab.id);
			await sleep(500);

			await sendMessageToTab("optionTab", {command: "START_RECORDING"});
			const baseVolume = await sendToActive({command: "GET_VALUE", type: "volume"}).then((val) => {return val});
			const basePlaybackRate = await sendToActive({command: "GET_VALUE", type: "playbackRate"}).then((val) => {return val});
			return {message: "Playing.",
					volume: baseVolume.volume,
					playbackRate: basePlaybackRate.playbackRate,
				};
		} else {
			if (!optionTab?.audible) {
				console.error("Option tab isn't playing audio but content tab is.");
				return {message: "Error, check devtools."};
			}
			//Already playing, get properties
			let response = {message: "Already playing.",
				volume: 0,
				playbackRate: 0,
				pitch: 0,
				pitchWet: 0,
				reverbDecay: 0,
				reverbWet: 0
			}
			for (let key of Object.keys(response)) {
				if (key !== "message") {
					response[key] = await getStorage(key);
				}
			}
			return response;
		}
	} else {
		console.warn("Content tab isn't playing audio.");
		return {message: "No audio on current tab."};
	}
}

chrome.runtime.onInstalled.addListener(() => {
	clearStorage().then(() => {console.log("Cleared local storage.");});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("Background req", request);
	if (request.command === "START_MIXER") {
		runCode().then((response) => {
			console.log("content response:", response);
			sendResponse(response);
		})
		return true
	}
	if (request.command === "EXIT_MIXER") {
		exitOptions().then((result) => {sendResponse(result)})
		return true
	}
	if (request.command === "TOGGLE_PLAYBACK" || ["playbackRate", "volume"].includes(request.type)) {
		sendToActive(request).then((result) => {sendResponse(result);})
		return true
	}
  });

chrome.tabs.onRemoved.addListener(async (tabId) => {
	const activeTabId = await getStorage("activeTab");
    const optionTabId = await getStorage("optionTab");
	
	if (tabId === optionTabId) {
		await sendToActive({command: "SET_VALUE", type: "playbackRate", value: 1}).then(() => {
			console.log("Reset playback rate.");
		});
		clearStorage().then(() => {console.log("Cleared storage");});
		console.log("Options tab was closed");
	}
	if (tabId === activeTabId) {
		exitOptions().then((result) => {
			console.log("Options tab was closed with content tab,", result);
		});
	}
});