import { getStorage, setStorage, roundNumber } from "$lib/util/util"; 
import { getInjectedValue, setInjectedValue, toggleInjectedPlayback,  updateSlider, INJECT_WEBSITE } from "$lib/util/siteSpecific";
import type { ContentProperty, PropertyValue, CustomMedia, Media } from "$lib/types";
import { messages } from "$lib/data";

var myMedia: Media = null;

async function getValue(type: ContentProperty) {
	if (INJECT_WEBSITE) {
		const val = await getInjectedValue(type);
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
	if (type === "volume") {
		updateSlider(value);
	}
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
}

function getMedia(): Media {
	const mediaElements: (HTMLAudioElement|HTMLVideoElement)[] = [...document.getElementsByTagName("audio"), ...document.getElementsByTagName("video")];
	if (mediaElements.length !== 0) {
		const mediaPlaying = Object.values(mediaElements).filter(element => (element as CustomMedia).playing);
		if (mediaPlaying.length === 1) {
			// console.log("Media found", mediaPlaying[0]);
			return mediaPlaying[0];
		} else if (mediaPlaying.length > 1) {
			// Only checking if element is playing, not if element is audible.
			console.warn(messages.CONTENT_MULTIPLE, mediaPlaying);
			return mediaPlaying[1];
		} else {
			console.warn(messages.NO_MEDIA_PLAYING, mediaPlaying);
			return (mediaElements.length > 0) ? mediaElements[0] : null
		}
	} else {
		console.warn(messages.NO_MEDIA, messages.GITHUB_WEBSITE);
	}
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
				getValue("volume").then((value) => {
					setValue("volume", value);
				});
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
				myMedia = getMedia();
				if (myMedia) {
					getStorage("volume").then((val) => {
						myMedia.volume = val;
					})
					getStorage("playbackRate").then((val) => {
						myMedia.playbackRate = val;
					});
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
