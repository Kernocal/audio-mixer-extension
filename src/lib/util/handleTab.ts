import { getStorage } from "./util";
import { messages } from "$lib/data";

export function tabCapture(): Promise<MediaStream | null> {
	return new Promise((resolve) => {
		chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
				resolve(stream);
			}
		);
	});
}

export function getActiveTab(): Promise<chrome.tabs.Tab> {
	return new Promise((resolve) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
			resolve(tabs[0]);
		})
	})
}

export async function getTab(tabId: number) {
	try {
		return await chrome.tabs.get(tabId);
	} catch (e) {
		console.warn(messages.GET_TAB, e);
		return null;
	}
}

export async function removeTab(tabId: number) {
	try {
		return await chrome.tabs.remove(tabId);
	} catch (e) {
		console.warn(messages.REMOVE_TAB, e);
		return null;
	}
}

export function openRecordTab(): Promise<chrome.tabs.Tab> {
    return new Promise(async (resolve) => {
		try {
			chrome.tabs.create({
				pinned: true,
				active: false,
				url: `chrome-extension://${chrome.runtime.id}/record.html`}, (tab) => {
				resolve(tab);
				}
			);
		} catch (e) {
			console.warn(messages.CREATE_TAB, e);
		}
    });
}

export async function sendTabCommand(tabId: number, data: Object) {
	try {
		return await chrome.tabs.sendMessage(tabId, data)
	} catch (e) {
		console.warn(messages.COMMAND_FAILED, e);
		return null;
	}
}