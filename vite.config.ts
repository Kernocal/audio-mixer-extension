import { defineConfig } from "vite";
import { sveltekit } from '@sveltejs/kit/vite';
import Unocss from 'unocss/vite';
import extractorSvelte from '@unocss/extractor-svelte';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		Unocss({
			extractors: [
				extractorSvelte(),
			],
		}),
		sveltekit()
	],
	resolve: {
		alias: {
			$static: resolve('./static')
		}
	},
	build: {
		rollupOptions: {
		  input: {
			background: resolve('./src/background'),
			content: resolve('./src/content.ts'),
		  }
		}
	}	
});