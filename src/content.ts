import { getStorage, setStorage } from "$lib/util/util"; 
import { updateYoutubeSlider } from "$lib/util/siteSpecific";

function getValue(type) {
	return getStorage(type).then((val) => {
		console.log("storage val", val, "current val", myMedia[type]);
		if (val === myMedia[type]) {
			return val;
		} else {
			console.warn("Storage value and media value aren't the same", type, val, myMedia[type]);
			let newVal = myMedia[type];
			newVal = +newVal.toFixed(2);
			setStorage(type, newVal);
			return newVal;
		}
	});
}

async function updateValue(type, value) {
	try {
		myMedia[type] = value;
		await setStorage(type, value);
		if (window.location.host.includes("youtube.com")) {
			updateYoutubeSlider(value);
		}
	} catch (e) {
		console.warn("Updating value error,", type, value, e);
	}
}

function getMedia() {
	const mediaElements = document.querySelectorAll("audio, video");
	console.log("Media elements, ", mediaElements);
	if (mediaElements.length !== 0) {
		const myMedia = Object.values(mediaElements).filter(val => val.playing);
		if (myMedia.length !== 1) {
			console.error("Multiple currently playing media elements,", myMedia);
		} else {
			console.log("Media found", myMedia[0]);
			return myMedia[0];
		}
	} else {
		console.error("No media found, despite in a state of audible tab.");
		return null;
	}
}
// @ts-expect-error
if (typeof alreadyInjected === "undefined") {
	console.log("Injected.");

	if (!myMedia?.playing) {
		//Media elements don't have a native playing attribute, creates attribute based on media properties.
		// writable: true,
		// configurable: true,
		Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
			get: function(){
				return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
			}
		});
	}

	if (!myMedia) {
		var myMedia;
		myMedia = getMedia();
		updateValue("volume", myMedia["volume"]);
		updateValue("playbackRate", myMedia["playbackRate"]);
	}

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		console.log("Content req", request);
		if (request.command === "TOGGLE_PLAYBACK") {
			myMedia.paused ? myMedia.play() : myMedia.pause();
			sendResponse({message: "success"});
			return true;
		}
		if (["playbackRate", "volume"].includes(request.type)) {
			if (request.command === "GET_VALUE") {
				getValue(request.type).then((val) => {
					console.log("content sending:", {message: "success", [request.type]: val});
					sendResponse({message: "success", [request.type]: val});
				});
				return true;
			}
			if (request.command === "SET_VALUE") {
				updateValue(request.type, request.value).then(() => {
					sendResponse({message: "success", [request.type]: request.value});
				});
				return true;
			}
		}
	});
}
var alreadyInjected = true;