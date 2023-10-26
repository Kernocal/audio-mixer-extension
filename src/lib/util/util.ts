// import type { key } from "$lib/types";

export function executeScript(tabId, file) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({target: {tabId}, files: [file]}, () => {
          resolve();
        }
      );
    });
}

export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;

        document.body.appendChild(script);

        script.addEventListener('load', () => resolve(script));
        script.addEventListener('error', () => reject(script));
    });
}

export function getStorage(key) {
    return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
    	});
	});
}

export function setStorage(key: key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({[key]: value}, () => {
            resolve(value);
        });
    });
}

export function clearStorage() {
	return new Promise((resolve) => {
		chrome.storage.local.clear((res) => {
			resolve(res);
		  }
		);
	  });
}

export function compareObjects(obj1, obj2) {
    console.log("comparing", obj1, "and", obj2);
	return Object.entries(obj1).sort().toString() === Object.entries(obj2).sort().toString();
}

export function sleep(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}