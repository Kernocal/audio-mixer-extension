(() => {
    var myMedia = null;
    var volume;
    var myPlaybackRate;
    
    function log(...args) {
        console.log("Audio Mixer INJECT:", ...args);
    }
    
    function getMedia(media, mediaValues = true) {
        // log("media", media);
        if (myMedia === null) {
            myMedia = media;
            if (mediaValues) {
                volume = myMedia.volume;
                myPlaybackRate = myMedia.myPlaybackRate;
            } else {
                myMedia.volume = volume;
                myMedia.myPlaybackRate = myPlaybackRate;
            }
            // ({volume, myPlaybackRate} = myMedia);
        } else {
            if (!myMedia.isSameNode(media)) {
                log("Different media playing.");
            }
            myMedia = media;
            myMedia.volume = volume;
            myMedia.myPlaybackRate = myPlaybackRate;
        }
    }

    function setValue(type, value) {
        try {
            myMedia[type] = value
        } catch (e) {

        }
    }
    
    function init() {
        log("running.");
        Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
            get: function(){
                return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
            }
        });
    
        originalPlaybackRate = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
        Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
            get: originalPlaybackRate.get,
            set: () => {},
            }
        );
    
        Object.defineProperty(HTMLMediaElement.prototype, 'myPlaybackRate', {
            get: originalPlaybackRate.get,
            set: originalPlaybackRate.set
            }
        );
        
        HTMLMediaElement.prototype.originalPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function() {
            getMedia(this);
            return this.originalPlay(arguments);
        };
        
        
        document.addEventListener('GET_VALUE', (e) => {
            log("GIVE_VALUE event", e, e.detail.type, myMedia[e.detail.type]);
            // Get inject's custom playbackRate property value, otherwise access property as usual.
            let resObj = {detail: {type: e.detail.type}};
            if (e.detail.type === "playbackRate") {
                resObj.detail.value = myMedia.myPlaybackRate;
            } else {
                resObj.detail.value = myMedia[e.detail.type];
            }
            document.dispatchEvent(new CustomEvent('GIVE_VALUE', resObj));
        });
        
        document.addEventListener('SET_VALUE', (e) => {
            // log("SET_VALUE event", e, e.detail.type, e.detail.value);
            switch (e.detail.type) {
                case "volume":
                    volume = e.detail.value;
                    setValue("volume", volume)
                    break;
                case "playbackRate":
                    myPlaybackRate = e.detail.value;
                    setValue("myPlaybackRate", myPlaybackRate)
                    break;

                default:
                    console.warn("INJECT: SET_VALUE property is unknown/unexpected", e.detail.type);
            }
        });

        document.addEventListener('PAGE_CHANGE', (e) => {
            HTMLMediaElement.prototype.play = function() {
                getMedia(this, false);
                return this.originalPlay(arguments);
            };
        });
        
        document.addEventListener('TOGGLE_PLAYBACK', (e) => {
            // log("TOGGLE_PLAYBACK event", e);
            myMedia.paused ? myMedia.play() : myMedia.pause();
        });
    }
    
    init();
})();