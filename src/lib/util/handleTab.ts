import { getStorage } from "./util";

export function tabCapture() {
	return new Promise((resolve) => {
		chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
				resolve(stream);
			}
		);
	});
}

export function getActiveTab() {
	return new Promise((resolve) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
			resolve(tabs[0]);
		})
	})
}

export async function getOptionsTab(optionTabId) {
	try {
		return await chrome.tabs.get(optionTabId);
	} catch (e) {
		console.warn("Tab doesn't exist, ", e);
		return null;
	}
}

export function openOptionTab() {
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

export async function removeTab(tabId) {
	try {
		return await chrome.tabs.remove(tabId);
	} catch (e) {
		console.warn("Tab not removed, ", e);
		return null;
	}
}

export async function sendMessageToTab(tabId: string, data) {
	const id = await getStorage(tabId);
	try {
		return await chrome.tabs.sendMessage(id, data)
	} catch (e) {
		console.error("Unable to send message, ", e);
		return null;
	}
}