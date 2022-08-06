let myContext;
let myStream;
let pitchShift;

function changePitch(val) {
    pitchShift.pitch = val;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'receive-streamId') {
        console.log(request.streamId)
        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: request.streamId
                }
            }
        })
        .then((stream) => {
			let context = new AudioContext();
			let newStream = context.createMediaStreamSource(stream);
			newStream.connect(context.destination);
            // audioCtx = new AudioContext();
            // var audioStream = audioCtx.createMediaStreamSource(stream);
            // audioStream.connect(audioCtx.destination);
            // let gainNode = audioCtx.createGain();

            // audioStream.connect(gainNode);
        
            // myContext = Tone.setContext(audioCtx);
        
            // pitchShift = new Tone.PitchShift(3);
        
            // Tone.connect(gainNode, pitchShift);
            // Tone.connect(pitchShift, audioCtx.destination);
            // console.log("All done.")
        });
    }
    if (request.message === 'change_pitch') {
        changePitch(request.payload);
        sendResponse({message: 'success'});
    }
});

// let main_tt = document.createElement('div');
// let button_tt = document.createElement('button');
// let buttonChange_tt = document.createElement('button');
// let input_tt = document.createElement('input')
// button_tt.innerHTML = "play"
// buttonChange_tt.innerHTML = "change pitch"
// main_tt.appendChild(button_tt)
// main_tt.appendChild(buttonChange_tt)
// main_tt.appendChild(input_tt)
// document.querySelector('section').appendChild(main_tt);

// button_tt.addEventListener('click', async () => {
// 	await Tone.start()
// 	console.log('audio is ready')
//     play()
// })

// buttonChange_tt.addEventListener('click', () => {
//     changePitch(input_tt.value);
//     })