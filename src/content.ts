import { getStorage, setStorage, roundNumber } from "$lib/util/util"; 
import { INJECT_WEBSITE, getInjectedValue, setInjectedValue, toggleInjectedPlayback, injectedPageChange, updateSlider } from "$lib/util/siteSpecific";
import type { ContentProperty, PropertyValue, CustomMedia, NullMedia, MediaElements, Custom } from "$lib/types";
import { messages } from "$lib/data";

var myMedia: NullMedia = null;

async function getValue(type: ContentProperty) {
	if (INJECT_WEBSITE) {
		console.log("CONTENT: getting inject value", type);
		const val = await getInjectedValue(type);
		console.log("CONTENT: setting storage val", type, val);
		await setStorage(type, val);
		return val;
	} else {
		return getStorage(type).then((val) => {
			// console.log("storage val", val, "current val", myMedia[type], "type", type);
			const mediaVal = myMedia[type];
			if (val === mediaVal) {
				return val;
			} else {
				console.warn(`Out of sync ${type}: stored ${val},  media ${mediaVal}`);
				// let newVal = roundNumber(mediaVal, 2);
				setStorage(type, mediaVal);
				return mediaVal;
			}
		});
	}
}

async function setValue(type: ContentProperty, value: PropertyValue) {
	// console.log("Content: updating:", type, "val", value);
	if (INJECT_WEBSITE) {
		setInjectedValue(type, value);
		await setStorage(type, value);
	} else {
		try {
			(myMedia as CustomMedia)[type] = value;
			await setStorage(type, value);
		} catch (e) {
			console.warn(messages.SET_VALUE, "or adding value to storage,", type, value, e);
		}
	}
	if (type === "volume") {
		updateSlider(value);
	}
}

function getPlayingMedia(mediaElements: MediaElements) {
	const mediaPlaying = Object.values(mediaElements).filter(element => (element as CustomMedia).playing);
	if (mediaPlaying.length === 1) {
		return mediaPlaying[0];
	} else if (mediaPlaying.length > 1) {
		// todo: Let user pick which media if many playing.
		console.warn(messages.CONTENT_MULTIPLE, mediaPlaying);
		return mediaPlaying[0];
	}
	console.warn(messages.NO_MEDIA_PLAYING, mediaPlaying);
	return null;
}

function getMedia(): NullMedia {
	const mediaElements: MediaElements = [...document.getElementsByTagName("audio"), ...document.getElementsByTagName("video")];
	if (mediaElements.length === 1) {
		return mediaElements[0]
	} else if (mediaElements.length > 1) {
		return getPlayingMedia(mediaElements);
	}
	console.warn(messages.NO_MEDIA, messages.GITHUB_WEBSITE);
	return null;
}

function init() {
	if (typeof contentInjected === "undefined") {
		console.log(messages.CONTENT_INJECTED);

		// Media elements do not have a native playing attribute, create attribute using media properties.
		const dummyElement = document.createElement("audio");
		if (!('playing' in dummyElement)) {
			Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
				get: function(){
					return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
				}
			});
		}
	
		if (!(myMedia instanceof HTMLMediaElement)) {
			if (INJECT_WEBSITE) {
				console.log("CONTENT: getting setting inject volume");
				getValue("volume").then((value) => {
					setValue("volume", value);
				});
				console.log("CONTENT: getting setting inject playbackRate");
				getValue("playbackRate").then((value) => {
					setValue("playbackRate", value);
				});
			} else {
				myMedia  = getMedia();
				if (myMedia) {
					setValue("volume", myMedia.volume);
					setValue("playbackRate", myMedia.playbackRate);
				}
			}
		}
	
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.command === "PING") {
				sendResponse({message: "PONG"});
				return true;
			}
			if (request.command === "TOGGLE_PLAYBACK") {
				if (INJECT_WEBSITE) {
					toggleInjectedPlayback();
				} else {
					if (myMedia) {
						myMedia.paused ? myMedia.play() : myMedia.pause();
					}
				}
				sendResponse({message: "success"});
				return true;
			}
			if (request.command === "PAGE_CHANGE") {
				if (!INJECT_WEBSITE) {
					// split to getNewMedia if flag is set as history page changes dont make new media element.
					const test = myMedia;
					myMedia = getMedia();
					console.log("CONTENT: new media", myMedia);
					setValue("volume", request.volume);
					setValue("playbackRate", request.playbackRate);
					myMedia?.addEventListener("timeupdate", () => {
						// too fast for volume to be set, youtube just resets
						console.log("CONTENT: PLAYING NAOW");
						console.log("CONTENT: setting vol", request.volume, "playbr", request.playbackRate);
						setValue("volume", request.volume);
						setValue("playbackRate", request.playbackRate);
					}, {once: true});
				} else {
					// inject
					console.log("CONTENT: setting vol", request.volume, "playbr", request.playbackRate);
					setValue("volume", request.volume);
					setValue("playbackRate", request.playbackRate);
					injectedPageChange();
				}
				sendResponse({message: "success"});
				return true;
			}
			if (["playbackRate", "volume"].includes(request.type)) {
				if (request.command === "GET_VALUE") {
					getValue(request.type).then((value) => {
						// console.log("content sending:", {message: "success", type: request.type, value});
						sendResponse({message: "success", type: request.type, value});
					});
					return true;
				}
				if (request.command === "SET_VALUE") {
					// console.log("SET_VALUE:", request.type, request.value);
					setValue(request.type, request.value).then(() => {
						sendResponse({message: "success", type: request.type, value:request.value});
					});
					return true;
				}
			}
		});
	}
}

init();
var contentInjected = true;
