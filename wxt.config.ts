import { resolve } from 'node:path'
import { defineConfig } from 'wxt'

export default defineConfig({
    manifest: {
        name: '__MSG_extension_name__',
        description: '__MSG_extension_description__',
        default_locale: 'en',
        permissions: [
            'activeTab',
            'scripting',
            'storage',
            'tabCapture',
            'tabs',
            'webNavigation',
            'offscreen',
        ],
        host_permissions: [
            '*://soundcloud.com/*',
            '*://open.spotify.com/*',
            '*://*.youtube.com/*',
        ],
        action: {},
    },
    srcDir: 'src',
    modules: ['@wxt-dev/unocss', '@wxt-dev/module-svelte', '@wxt-dev/i18n/module'],
    alias: {
        lib: resolve('src/lib/'),
    },
    webExt: {
        disabled: false,
        binaries: {
            chrome: 'C:/Users/Kern/AppData/Local/Chromium/Application/chrome.exe',
        },
        keepProfileChanges: true,
        chromiumProfile: resolve('.wxt/chrome-data'),
    },
})
