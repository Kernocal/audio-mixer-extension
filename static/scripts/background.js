import {sleep, getStorage, setStorage, clearStorage, getCurrentTab, getOptionsTab, removeTab} from '/scripts/common.js';

function openOptions() {
    return new Promise(async (resolve) => {
      chrome.tabs.create({
		pinned: true,
		active: false,
		url: `chrome-extension://${chrome.runtime.id}/options.html`}, (tab) => {
          resolve(tab);
        }
      );
    });
}

function executeScript(tabId, file) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({target: {tabId}, files: [file]}, () => {
          resolve();
        }
      );
    });
}

async function sendMessageToTab(type, data) {
	const id = await getStorage(type);
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(id, data, (res) => {
        resolve(res);
      });
    });
}

async function sendToContent(data) {
	const id = await getStorage("currentTabId");
	return sendMessageToTab("currentTabId", data)
}

async function exitOptions() {
	const optionTabId = await getStorage("optionTabId");
	const result = await removeTab(optionTabId);
	clearStorage().then(() => {console.log("Cleared storage");});
	if (result) {
		return {message: "success"}
	}
}

async function runCode() {
	const currentTab = await getCurrentTab();
	if (currentTab.audible) {
		const id = await getStorage("optionTabId");
		const optionTab = await getOptionsTab(id);
		if (!optionTab) {
			//Play and connect
			await setStorage("currentTabId", currentTab.id);
			await executeScript(currentTab.id, "scripts/content.js");
			await sleep(500);
			const newOptionTab = await openOptions();
			await setStorage("optionTabId", newOptionTab.id);
			await sleep(500);

			const record = await sendMessageToTab("optionTabId", {message: "start-recording"});
			const baseVolume = await sendToContent({message: "get-volume"}).then((val) => {return val});
			const basePlaybackRate = await sendToContent({message: "get-playbackRate"}).then((val) => {return val});
			return {message: "Playing",
					volume: baseVolume.volume,
					playbackRate: basePlaybackRate.playbackRate,
				};
		} else {
			if (!optionTab?.audible) {
				console.error("Option tab isn't playing audio but content tab is.");
				return "Error, check devtools.";
			}
			//Already playing, get properties
			let response = {message: "Already playing",
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
	}
}

chrome.runtime.onInstalled.addListener(() => {
	clearStorage().then(() => {console.log("Cleared storage");});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "start-playing") {
		runCode().then((result) => {sendResponse(result);})
		return true
		}
	if (request.message === "exit-options") {
		exitOptions().then((result) => {sendResponse(result)})
		return true
	}
	if (["toggle-media", "update-playbackRate", "update-volume"].includes(request.message)) {
		sendToContent(request).then((result) => {sendResponse(result);})
		return true
	}
  });

// chrome.tabs.onRemoved.addListener(async (tabId) => {
// 	const currentTabId = await getStorage("currentTabId");
//     const optionTabId = await getStorage("optionTabId");
  
//     if (currentTabId === tabId && optionTabId) {
// 		clearStorage().then(() => {console.log("Cleared storage");});
//       	await removeTab(optionTabId);
// 	}
// });