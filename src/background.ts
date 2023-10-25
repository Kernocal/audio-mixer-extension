function sleep(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStorage(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
}
  
function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({[key]: value}, () => {
        resolve(value);
      }
    );
  });
}

function clearStorage() {
	return new Promise((resolve) => {
		chrome.storage.local.clear((res) => {
			resolve(res);
		  }
		);
	  });
}

function getCurrentTab() {
	return new Promise((resolve) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
			resolve(tabs[0]);
		})
	})
}

async function getOptionsTab(optionTabId) {
	try {
		return await chrome.tabs.get(optionTabId);
	} catch (e) {
		console.warn("Tab doesnt exist, ", e);
		return null;
	}
}

async function removeTab(tabId) {
	try {
		return await chrome.tabs.remove(tabId);
	} catch (e) {
		console.warn("Tab not removed, ", e);
		return null;
	}
}

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
	try {
		return await chrome.tabs.sendMessage(id, data)
	} catch (e) {
		console.error("Unable to send message, ", e);
		return null;
	}
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
		return {message: "Quit connection."}
	}
}

async function runCode() {
	const currentTab = await getCurrentTab();
	if (currentTab?.audible) {
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

chrome.tabs.onRemoved.addListener(async (tabId) => {
	const currentTabId = await getStorage("currentTabId");
    const optionTabId = await getStorage("optionTabId");
	
	if (tabId === optionTabId) {
		await sendToContent({message: "update-playbackRate", playbackRate: 1}).then(() => {console.log("Reset playbackRate");});
		clearStorage().then(() => {console.log("Cleared storage");});
		console.log("Options tab was closed");
	}
	if (tabId === currentTabId) {
		exitOptions().then((result) => {console.log("Options tab was closed with content tab,", result);});
	}
});