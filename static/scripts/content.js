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

function getValue(type) {
	return getStorage(type).then((val) => {
		//Val stored can sometimes get out of sync with media playing
		if (val !== myMedia[type]) {
			console.log("Setting ", type, val, myMedia[type]);
			setStorage(type, myMedia[type]);
			return myMedia[type];
		} else {
			console.log("Not setting ", type, val, myMedia[type]);
			return val;
		}
	})
}

async function updateValue(type, value) {
	try {
		myMedia[type] = value;
		const val = await setStorage(type, value)
	} catch (e) {
		console.warn("Updating value error,", e)
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

if (typeof alreadyInjected === "undefined") {
	console.log("Injected.");

	if (!myMedia?.playing) {
		//Media elements dont have a native playing attribute, creates attribute based on media properties.
		Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
			get: function(){
				return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
			}
		});
	}

	if (!myMedia) {
		var myMedia;
		myMedia = getMedia();
	}

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		const [message, type] = request.message.split("-");
		
		if (message === "get") {
			getValue(type).then((val) => {
				sendResponse({message: "success", [type]: val});
			});
			return true;
		}
		if (message === "update") {
			const value = request[type];
			updateValue(type, value);
			sendResponse({message: "success", [type]: value});
		}
		if (request.message === "toggle-media") {
			myMedia.paused ? myMedia.play() : myMedia.pause();
			sendResponse({message: "success"});
		}
	});
}
var alreadyInjected = true;