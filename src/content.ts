import { getStorage, setStorage, roundNumber } from "$lib/util/util"; 
import { INJECT_WEBSITE, getInjectedValue, setInjectedValue, sendEvent, updateSlider } from "$lib/util/siteSpecific";
import { messages } from "$lib/data";
import type { ContentProperty, PropertyValue, CustomMedia, NullMedia, MediaElements, Custom } from "$lib/types";

var myMedia: NullMedia = null;

async function getValue(type: ContentProperty) {
	if (!INJECT_WEBSITE && myMedia) {
		const storedValue = await getStorage(type);
		const mediaValue = myMedia[type];
		if (storedValue !== mediaValue) {
			console.warn(`Out of sync ${type}: stored ${storedValue},  media ${mediaValue}`);
			setStorage(type, mediaValue);
			return mediaValue;
		} else {
			return storedValue;
		}
	} else {
		const value = await getInjectedValue(type);
		await setStorage(type, value);
		return value;
	}
}

async function setValue(type: ContentProperty, value: PropertyValue) {
	if (!INJECT_WEBSITE && myMedia) {
		myMedia[type] = value;
	} else {
		setInjectedValue(type, value);
	}
	await setStorage(type, value);
	if (type === "volume") {
		updateSlider(value);
	}
}

async function setMediaValues(volume: number, playbackRate: number) {
	await setValue("volume", volume);
	await setValue("playbackRate", playbackRate);
}

async function setupInjected() {
	const pageChange = await getStorage("pageChange");
	if (!pageChange) {
		const volume = await getValue("volume");
		const playbackRate = await getValue("playbackRate");
		await setMediaValues(volume, playbackRate);
	}
	await setStorage("pageChange", false);
}

function getPlayingMedia(mediaElements: CustomMedia[]) {
	const mediaPlaying = Object.values(mediaElements).filter(element => element.playing);
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
	// @ts-ignore: mediaElements should always have playing attribute in this context space.
	const mediaElements: CustomMedia[] = document.querySelectorAll("audio, video");
	if (mediaElements.length === 1) {
		return mediaElements[0]
	} else if (mediaElements.length > 1) {
		return getPlayingMedia(mediaElements);
	}
	console.warn(messages.NO_MEDIA, messages.GITHUB_WEBSITE);
	return null;
}

function init() {
	console.log(messages.CONTENT_EXECUTED);

	const dummyElement = document.createElement("audio");
	if (!('playing' in dummyElement)) {
		// Media elements do not have a native playing attribute, create attribute using media properties.
		Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
			get: function(){
				return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
			}
		});
	}

	if (!(myMedia instanceof HTMLMediaElement)) {
		if (!INJECT_WEBSITE) {
			myMedia = getMedia();
			if (myMedia) {
				setStorage("volume", myMedia.volume);
				setStorage("playbackRate", myMedia.playbackRate);
			}
		} else {
			setupInjected();
		}
	}

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.command === "PING") {
			sendResponse({message: "PONG"});
			return true;
		}
		if (["playbackRate", "volume"].includes(request.type)) {
			if (request.command === "GET_VALUE") {
				getValue(request.type).then((value) => {
					sendResponse({message: "success", type: request.type, value});
				});
				return true;
			}
			if (request.command === "SET_VALUE") {
				setValue(request.type, request.value).then(() => {
					sendResponse({message: "success"});
				});
				return true;
			}
		}
		if (request.command === "TOGGLE_PLAYBACK") {
			if (!INJECT_WEBSITE && myMedia) {
				myMedia.paused ? myMedia.play() : myMedia.pause();
			} else {
				sendEvent('TOGGLE_PLAYBACK');
			}
			sendResponse({message: "success"});
			return true;
		}
		if (request.command === "PAGE_CHANGE") {
			if (!INJECT_WEBSITE) {
				myMedia?.addEventListener("timeupdate", () => {
					// console.log("CONTENT: PLAYING NAOW setting vol", request.volume, "playbackRate", request.playbackRate);
					setMediaValues(request.volume, request.playbackRate);
				}, {once: true});
			} else {
				setMediaValues(request.volume, request.playbackRate);
				sendEvent('PAGE_CHANGE');
			}
			sendResponse({message: "success"});
			return true;
		}
	});
}

(() => {
	getStorage("contentExecuted").then((executed) => {
		if (!executed || executed === undefined) {
			init();
			setStorage("contentExecuted", true);
		}
	})
})();
