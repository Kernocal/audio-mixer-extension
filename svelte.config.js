// import adapter from '@sveltejs/adapter-auto';
import adapter from "sveltekit-adapter-chrome-extension";

import { windi } from "svelte-windicss-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		windi({})
	],
	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: null,
			precompress: false,
			manifest: "manifest.json"
		}),
		appDir: "app"
	}
};

export default config;
