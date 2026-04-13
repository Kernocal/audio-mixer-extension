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
        action: {},
    },
    srcDir: 'src',
    modules: ['@kernocal/validate-store', '@wxt-dev/unocss', '@wxt-dev/module-svelte', '@wxt-dev/i18n/module', '@wxt-dev/auto-icons'],
    autoIcons: {
        baseIconPath: 'lib/assets/icon.png',
    },
    alias: {
        lib: resolve('src/lib/'),
    },
    webExt: {
        disabled: false,
        binaries: {
            chrome: 'C:/Users/Kern/AppData/Local/Chromium/Application/chrome.exe',
            edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        },
        keepProfileChanges: true,
        chromiumProfile: resolve('.wxt/chrome-data'),
        chromiumArgs: ['--lang=en'],
    },
})
