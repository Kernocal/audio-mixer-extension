import { resolve } from 'node:path'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
    manifest: {
        name: '__MSG_extensionName__',
        description: '__MSG_extensionDescription__',
        default_locale: 'en',
        permissions: [
            'activeTab',
            'scripting',
            'storage',
            'tabCapture',
            'tabs',
            'webNavigation',
        ],
        host_permissions: [
            '*://soundcloud.com/*',
            '*://open.spotify.com/*',
            '*://*.youtube.com/*',
        ],
        action: {},
    },
    srcDir: 'src',
    modules: ['@wxt-dev/unocss', '@wxt-dev/module-svelte'],
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
