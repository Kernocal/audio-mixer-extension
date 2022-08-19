

# 2022-08-19

- [x] Catch remaining errors.

- [x] Update messages, reset propeties on deleting options tab, catch errors.

- [x] Make active effects show on ui, move to grid instead of 5x flexboxes.

- [x] Update popup ui to show whats active, button actives, so on.

# 2022-08-18

- [x] Ensure local storage gets cleared, preset sometimes doesn't clear.

- [x] Add safety in content script to stop redefining when script is injected more than once.

- [x] Toggling play statemarkdown-language-features doesnt work when quit then reopened -> Above mostly resovled this.

- [x] Move option js closer to actual route.

# 2022-08-16

- [y] Double pause method - updating Audio.prototype works differently in injected script compared to devtools


# 2022-08-14

- [x] Update content, get current playing media element by adding new object prototype attribute

- [x] Update content's functions, store media element and use it.

- [x] Simplify content, option and background request.message handlers.

- [x] Continue option changes, moved onMessage logic to options.

- [y] Maybe change background main function for consistency.

- [x] Local storage doesnt clear when changing between tabs which results in incorrect volume playbackrate displayed.

# 2022-08-11

- [x] On tonejs effect change RangeError: Value must be within [0.001, Infinity], got: 0

- [] Give feedback on injected scripts, reject promise 

- [y] Change content to store the actual element's media identity in localstorage

- [y] refactor getStorage setStorage to work within module (svelte) and without. part 2.

- [y] refactor other functions to work with in without module context?

# 2022-08-10

- [x] checkout onRemoved add listner, might be trying to remove tabs twice

- [x] find out how pitch wet gets desynced

- [x] Fix presets, add reverb, optional values

- [x] Add logic for reverb

# 2022-08-09

- [x] Set volume on startup, requires injecting content script first.
    sendToContent doesnt return result because sendMessageToTab doesnt return result

- [x] Store and retreive values for popup

- [x] Add UI amount of effect(wetness) to pitch

- [x] add reverb settings

- [x] Ability to change volume

- [x] Change flow on popup open -> check if options is open then options in localstorage