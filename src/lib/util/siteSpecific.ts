import { setElementAttributes, URLIncludes, roundNumber } from './util';
import type {Property, PropertyValue, GiveValueEvent} from '../types';

const SOUNDCLOUD = URLIncludes("soundcloud.com");
const SPOTIFY = URLIncludes("open.spotify.com");
const YOUTUBE = URLIncludes("youtube.com");

export const INJECT_WEBSITE = SOUNDCLOUD || SPOTIFY;
const SLIDER_WEBSITE = INJECT_WEBSITE || YOUTUBE;

export function getInjectedValue(type: Property) {
	return new Promise((resolve) => {
		document.addEventListener('GIVE_VALUE', (e) => {
			// console.log("CONTENT: GOT val", e);
			resolve((<GiveValueEvent>e).detail.value);
		});
		// console.log("CONTENT: Getting val", type);
		document.dispatchEvent(new CustomEvent('GET_VALUE', {
			detail: {type}
		}));
	})
}

export function setInjectedValue(type: Property, value: PropertyValue) {
	// console.log("CONTENT: Setting val", type, value);
	document.dispatchEvent(new CustomEvent('SET_VALUE', {
			detail: {type, value},
	}));
}

export function toggleInjectedPlayback() {
	// console.log("CONTENT: Toggling playback");
	document.dispatchEvent(new CustomEvent('TOGGLE_PLAYBACK', {}));
}

export function updateSlider(volume: PropertyValue) {
	if (SOUNDCLOUD) {
		updateSoundcloudSlider(volume);
	} else if (SPOTIFY) {
		updateSpotifySlider(volume);
	} else if (YOUTUBE) {
		updateYoutubeSlider(volume);
	}
}

function updateSoundcloudSlider(volume: PropertyValue) {
	//Any volume above 0 but below 0.05 sc considers muted.
	volume = (volume > 0 && volume < 0.05) ? 0.05 : volume;

	// Update volume slider: uses height: 0-92px.
	setElementAttributes("div.volume__sliderProgress", {
		"style": `height: ${volume * 92}px`
	});

	// Update volume handle: uses top: 102px-10px from 0-1. 
	const volumeToTop = ((1 - volume) * 92) + 10;
	setElementAttributes("div.volume__sliderHandle", {
		"style": `top: ${volumeToTop}px`
	});

	// Update data-level value
	const volumeDecimal = roundNumber(volume * 10);
	setElementAttributes("div.volume", {
		"data-level": volumeDecimal
	});

	// Update aria
	const volume2Dp = roundNumber(volume, 2);
	setElementAttributes("div.volume__sliderWrapper", {
		"aria-valuenow": volume2Dp
	});
}

function updateSpotifySlider(volume: PropertyValue) {
	// Update input, value 0-1. Selector was picking up more inputs, use all attributes.
	setElementAttributes("label > input[type='range'][step='0.1'][min='0'][max='1']", {
		"value": volume
	});

	// div style="--progress-bar-transform" 0-100%. Selector was picking up more inputs, use root element data-testid volume-bar.
	setElementAttributes("div[data-testid='volume-bar'] > div > div > div[data-testid='progress-bar']", {
		"style": `--progress-bar-transform: ${volume * 100}%`
	});	

	// Update arias.
	// Volume off == 0 < Volume low < 0.33^ < Volume medium < 0.66^ < Volume high <= 1
	const volumeSetting = (
		volume < 0.01 ? "off" :
		volume < 0.33 ? "low" :
		volume < 0.66 ? "medium" :
		volume <= 1 ? "high" :
		""
	);
	setElementAttributes("svg[id='volume-icon']", {
		"aria-label": `Volume ${volumeSetting}`
	});

	// Also found by data-testid="volume-bar-toggle-mute-button" if breaks.
	setElementAttributes("button.control-button[aria-describedby='volume-icon']", {
		"aria-label": (volume < 0.01 ? "Unmute" : "Mute")
	});
}

function updateYoutubeSlider(volume: PropertyValue) {
	// Youtube has an inline player that has the exact same class names for the controls.
	const youtubeRealVolumeArea = "#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > span.ytp-volume-area"

	// Update volume slider: uses left: 0-40px. 100/40px -> 2.5px ratio
	const volumeAmount = volume * 100
	setElementAttributes(`${youtubeRealVolumeArea} > div.ytp-volume-panel > div.ytp-volume-slider > div.ytp-volume-slider-handle`, {
		"style": `left: ${volumeAmount / 2.5}px`
	});
	// Update aria values
	const wholeVolume = roundNumber(volumeAmount);
	setElementAttributes(`${youtubeRealVolumeArea} > div.ytp-volume-panel`, {
		"aria-valuenow": wholeVolume,
		"aria-valuetext": `${wholeVolume}% volume`
	});
}