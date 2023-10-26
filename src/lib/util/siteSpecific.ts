export function updateYoutubeSlider(volume) {
    // div .ytp-volume-slider-handle uses left: 0-40px style for volume. 100/40px -> 2.5
	const volumeSlider = document.querySelectorAll("div.ytp-volume-slider-handle");
	const volumeAmount = volume * 100
	if (volumeSlider.length == 1) {
		const leftAmount = volumeAmount / 2.5;
		volumeSlider[0].setAttribute("style", `left: ${leftAmount}px`);
	}
	//update arias
	const volumePanel = document.querySelectorAll("div.ytp-volume-panel");
	if (volumePanel.length == 1) {
		volumePanel[0].setAttribute("aria-valuenow", `${volumeAmount}`);
		volumePanel[0].setAttribute("aria-valuetext", `${volumeAmount}% volume`);
	}
}