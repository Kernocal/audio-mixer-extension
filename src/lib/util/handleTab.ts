import { getStorage } from "./util";
import { messages } from "../data";
import type { ContentCommand } from "../types";

export function tabCapture(): Promise<MediaStream | null> {
	return new Promise((resolve) => {
		chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
				resolve(stream);
			}
		);
	});
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

export function getActiveTab(): Promise<chrome.tabs.Tab> {
	return new Promise((resolve) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
			resolve(tabs[0]);
		})
	})
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

export async function exitRecordTab() {
	const recordTabId = await getStorage("recordTab");
	const result = (recordTabId) ? await removeTab(recordTabId) : undefined;
	if (result) {
		return {message: messages.STATUS_QUIT};
	}
}

export async function sendTabCommand(tabId: number, data: Object, warn = true) {
	try {
		return await chrome.tabs.sendMessage(tabId, data)
	} catch (e) {
		if (warn) {
			console.warn(messages.COMMAND_FAILED, e);
		}
		return null;
	}
}

export async function sendContentTabCommand(data: ContentCommand, warn = true) {
	const tabId = await getStorage("contentTab");
	return await sendTabCommand(tabId, data, warn);
}
