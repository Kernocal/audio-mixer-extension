import adapter from "sveltekit-adapter-chrome-extension";
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
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
