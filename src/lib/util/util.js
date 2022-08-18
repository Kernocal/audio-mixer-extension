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

export function setStorage(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({[key]: value}, () => {
            resolve(value);
        });
    });
}

export function compareObjects(obj1, obj2) {
	return Object.entries(obj1).sort().toString() === Object.entries(obj2).sort().toString();
}