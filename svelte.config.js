// import adapter from '@sveltejs/adapter-auto';
import adapter from 'sveltekit-adapter-browser-extension';
import { windi } from "svelte-windicss-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		windi({})
	],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: undefined,
			fallback: undefined,
			manifestVersion: 3
		}),
		appDir: 'app',
		prerender: {
			default: true
		}
	}
};

export default config;
