export function sleep(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      }
    );
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

export function getCurrentTab() {
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
		console.warn("Tab doesnt exist, ", e);
		return null;
	}
}

export async function removeTab(tabId) {
	try {
		return await chrome.tabs.remove(tabId);
	} catch (e) {
		console.warn("Tab not removed, ", e);
		return null;
	}
}