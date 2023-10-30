import { messages } from '../data';
import type { OptionalProperties, Properties } from '../types';

export function sleep(ms = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function roundNumber(number: number, amount: 0|1|2|3|4 = 0) {
    return parseFloat(number.toFixed(amount));
}

export function URLIncludes(name: string) {
    return window.location.host.includes(name);
}

export function compareObjects(obj1: Object, obj2: Object) {
    // console.log("Comparing", obj1, "vs", obj2);
	return Object.entries(obj1).sort().toString() === Object.entries(obj2).sort().toString();
}

export function executeScript(tabId: number, filePath: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({target: {tabId}, files: [filePath]}, () => {
          resolve();
        }
      );
    });
}

export function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () => reject());
    });
}

export function getStorage(key: string): Promise<any> {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
            });
    });
}

export function setStorage(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({[key]: value}, () => {
            resolve();
        });
    });
}

export async function getValuesFromStorage(properties: OptionalProperties) {
    for (let key of Object.keys(properties)) {
        properties[key as keyof Properties] = await getStorage(key);
    }
    return properties;
}

export function clearStorage(): Promise<void> {
	return new Promise((resolve) => {
		chrome.storage.local.clear(() => {
			resolve();
		  }
		);
	  });
}

export function setElementAttributes(query: string, data: Object) {
    const elements = document.querySelectorAll(query);
    if (elements.length == 1) {
        try {
            for (let [attribute, attributeValue] of Object.entries(data)) {
                elements[0].setAttribute(attribute, attributeValue);
            }
        } catch (e) {
            console.warn(messages.QUERY_UNABLE_SET_ATTRIBUTE, data, e);
        }
    } else if (elements.length > 1) {
        console.warn(messages.QUERY_MULTIPLE, query, elements);
        return elements[1];
    } else {
        console.warn(messages.QUERY_NONE, query);
    }
}
