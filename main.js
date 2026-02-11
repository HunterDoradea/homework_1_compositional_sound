//to start - i have to initialize the audio context and setup a gain node: 
document.addEventListener("DOMContentLoaded", function(event) {

    //i have to define the buttons too
    const startBtn = document.getElementById("startBtn");

    const waveformSelect = document.getElementById("waveform");

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
    let globalGain = null;
    const activeVoices = {};
    //let activeOscillators = {};

    const MASTER_GAIN = 0.4;
    const MIX_HEADROOM = 0.9;
    const RELEASE_SECONDS = 0.06;
    const EPS = 0.0001; //this is the super tiny value i can use so it's not 0 lol


startBtn.addEventListener("click", async () => {

    // Create AudioContext 
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      globalGain = audioCtx.createGain();
      globalGain.gain.setValueAtTime(MASTER_GAIN, audioCtx.currentTime);

      // connect to the speaker 
      globalGain.connect(audioCtx.destination);
    }

    // Resume audio - this might not be necessary - i'll test it 
    await audioCtx.resume();
  });

  

//adding in the listeners to the keys - this will add and remove the listening oscillators. 
//this is the listening event codes
window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);

//here i can add the polyphony scaling part: 
  function updateVoiceGains() {
    const keys = Object.keys(activeVoices);
    const n = Math.max(keys.length, 1);
    const perVoice = MIX_HEADROOM / n;
    const now = audioCtx.currentTime;

    keys.forEach((k) => {
      activeVoices[k].voiceGain.gain.setTargetAtTime(perVoice, now, 0.01);
    });
  }

//the creative - aspect - i wanna have it change color each key: 
  function setBackground(freq) {
    const t = Date.now() / 1000;
    const hue = Math.floor((Math.log2(freq) * 97 + t * 25) % 360);
    document.body.style.backgroundColor = `hsl(${hue} 55% 14%)`;
  }

    

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
    const freq = keyboardFrequencyMap[key];
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    osc.type = waveformSelect.value;
    osc.frequency.setValueAtTime(freq, now);

    const envGain = audioCtx.createGain();
    envGain.gain.setValueAtTime(EPS, now);
    envGain.gain.exponentialRampToValueAtTime(1.0, now + 0.01); // quick fade-in

    const voiceGain = audioCtx.createGain();
    voiceGain.gain.setValueAtTime(0.0, now);

    osc.connect(envGain);
    envGain.connect(voiceGain);
    voiceGain.connect(globalGain);

    osc.start(now);

    activeVoices[key] = { osc, envGain, voiceGain, freq };

    updateVoiceGains();
    setBackground(freq);
  }

//stop the note 0 so it fades to 0: 
  function stopNote(key) {
    const v = activeVoices[key];
    const now = audioCtx.currentTime;

    v.envGain.gain.cancelScheduledValues(now);
    v.envGain.gain.setTargetAtTime(EPS, now, RELEASE_TC);

    const stopAt = now + RELEASE_TC * 6;
    v.osc.stop(stopAt);

    v.osc.onended = () => {
      try { v.osc.disconnect(); v.envGain.disconnect(); v.voiceGain.disconnect(); } catch (_) {}
      delete activeVoices[key];
      if (audioCtx) updateVoiceGains();
    };
  }


});
