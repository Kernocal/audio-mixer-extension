(() => {
    const EVENT_PREFIX = "AUDIO_MIXER_";
    var myMedia = null;
    var volume;
    var myPlaybackRate;

    function log(...args) {
        console.log("Audio Mixer INJECT:", ...args);
    }

    function createEvent(name, callback) {
        const eventName = EVENT_PREFIX + name;
        document.addEventListener(eventName, callback)
    }

    function setValue(type, value) {
        if (myMedia) {
            myMedia[type] = value
        }
    }

    function getMedia(media, pageChange = false) {
        if (myMedia && !myMedia.isSameNode(media)) {
            log("Different media playing.");
        }
        if (myMedia || pageChange) {
            myMedia = media;
            myMedia.volume = volume;
            myMedia.myPlaybackRate = myPlaybackRate;
        } else {
            myMedia = media;
            volume = myMedia.volume;
            myPlaybackRate = myMedia.myPlaybackRate;
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
        
        
        createEvent('GET_VALUE', (e) => {
            // log("GIVE_VALUE event", e, e.detail.type, myMedia[e.detail.type]);
            let resObj = {detail: {type: e.detail.type}};
            if (e.detail.type === "playbackRate") {
                resObj.detail.value = myMedia.myPlaybackRate;
            } else {
                resObj.detail.value = myMedia[e.detail.type];
            }
            document.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}GIVE_VALUE`, resObj));
        });
        
        createEvent('SET_VALUE', (e) => {
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
                    console.warn("Audio Mixer INJECT: SET_VALUE property is unknown/unexpected.", e.detail.type);
            }
        });

        createEvent('PAGE_CHANGE', (e) => {
            HTMLMediaElement.prototype.play = function() {
                getMedia(this, true);
                return this.originalPlay(arguments);
            };
        });
        
        createEvent('TOGGLE_PLAYBACK', (e) => {
            myMedia.paused ? myMedia.play() : myMedia.pause();
        })
    }

    init();
})();