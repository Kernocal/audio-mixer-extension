import { sveltekit } from '@sveltejs/kit/vite';
import WindiCSS from 'vite-plugin-windicss';

/** @type {import('vite').UserConfig} */
const config = {
        plugins: [
            WindiCSS(),
            sveltekit()],
};

export default config;