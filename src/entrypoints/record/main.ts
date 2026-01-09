import { mount } from 'svelte'
import Record from './Record.svelte'

const app = mount(Record, {
    target: document.getElementById('app')!,
})

export default app
