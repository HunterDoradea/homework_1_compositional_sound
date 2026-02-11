//to start - i have to initialize the audio context and setup a gain node: 
document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

//this is the actualy keyboard assignment map - i can change this later and customize it. 
   const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
}
    //right here i can add the start button functionality 
    let audioCtx = null; 
    let activeOscillators = {}

    startBtn.addEventListener("click", async () => {
        //this code is what happens when the start button is actualy prssed

        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

                await audioCtx.resume(); 
            
    }


//adding in the listeners to the keys - this will add and remove the listening oscillators. 
//this is the listening event codes
window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);


function keyDown(event) {
    //converst key pressed to string 
    const key = (event.detail || event.which).toString();
    //if the key is on the map above AND it's not active then play sound
    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
      playNote(key);
    }
}

function keyUp(event) {
    //this converst the key we pressed to a string
    const key = (event.detail || event.which).toString();
    //so if the key is currently active then stop it and then delete it. 
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        activeOscillators[key].stop();
        delete activeOscillators[key];
    }
}


    //this is how we will actually play the sound 
function playNote(key) {
    //this actually creates the oscillator
    const osc = audioCtx.createOscillator();
    //this sets the pitch 
    osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
    //this is where the DROPDOWN menu option will take place
    osc.type = waveformSelect.value;
    //this connects to the speaker 
    osc.connect(audioCtx.destination)
    //and this starts the sound
    osc.start();
    //this saves teh oscillator so we can stop it on key-up.
    activeOscillators[key] = osc
  }

});
