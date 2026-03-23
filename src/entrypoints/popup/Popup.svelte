<script lang='ts'>
    import { i18n } from '#imports'
    import Presets from 'lib/components/Presets.svelte'
    import PropertyControls from 'lib/components/PropertyControls.svelte'
    import { popupLogger } from 'lib/logger'
    import { sendMessage } from 'lib/messaging'
    import { playbackRate } from 'lib/storage/items.svelte'
    import { onMount } from 'svelte'
    import 'virtual:uno.css'

    let status = $state<string>(i18n.t('status.waiting'))
    let disabled = $state<boolean>(true)

    function exitMixer() {
        playbackRate.value = 1
        sendMessage('exitMixer')
        status = i18n.t('status.exit')
        window.close()
    }
    function preventOuterScroll(e: Event) {
        const target = e.target as HTMLElement | null
        if (target && !target.closest('.custom-scrollbar')) {
            e.preventDefault()
        }
    }

    onMount(async () => {
        const response = await sendMessage('startMixer')
        popupLogger.debug('response', response)
        if (response) {
            disabled = false
            status = i18n.t('status.playing')
        }
    })

</script>

<svelte:window onwheel={preventOuterScroll} ontouchmove={preventOuterScroll} />

<div class='bg animate flex flex-col h-[34.375rem] min-w-[31.25rem] w-fit whitespace-nowrap overflow-hidden'>
    <div class='grid-parent p-3 flex-1 gap-3 min-h-0 items-stretch'>
        <PropertyControls
            {disabled}
            onExit={exitMixer}
        />
        <Presets
            {status}
            {disabled}
        />
    </div>
</div>

<style lang='postcss'>

:global(html), :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    overscroll-behavior: none;
}

:global(html)::-webkit-scrollbar, :global(body)::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}

.grid-parent {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: minmax(0, 1fr);
}

.bg, .animate {
    background-color: rgba(0, 1, 20, 0.92);
}

.animate {
    animation: bg-animation 60s infinite linear;
}

@keyframes bg-animation {
    0%   { background-color: rgba(0, 1, 20, 0.92); }
    20%   { background-color: rgba(31, 0, 0, 0.92); }
    40%   { background-color: rgba(0, 43, 10, 0.92); }
    60%   { background-color: rgba(17, 0, 31, 0.92); }
    80%   { background-color: rgba(1, 0, 63, 0.92); }
    100%   { background-color: rgba(43, 23, 0, 0.92); }
}
</style>
