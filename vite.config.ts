import { defineConfig } from "vite";
import { sveltekit } from '@sveltejs/kit/vite';
import Unocss from 'unocss/vite';
import extractorSvelte from '@unocss/extractor-svelte';
// import { fileURLToPath } from 'url';

/** @type {import('vite').UserConfig} */
export default defineConfig({
	plugins: [
		Unocss({
			extractors: [
				extractorSvelte(),
			],
		}),
		sveltekit()
	]
});