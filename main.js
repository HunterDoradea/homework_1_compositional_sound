//to start - i have to initialize the audio context and setup a gain node: 
document.addEventListener("DOMContentLoaded", function(event) {

    //i have to define the buttons too
    const startBtn = document.getElementById("startBtn");

    const waveformSelect = document.getElementById("waveform");

//this is the actualy keyboard assignment map - i can change this later and customize it. 
    //this part i just copied from the assginment he gave us - the keyboard mapping
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


let audioCtx = null;
  let globalGain = null;

  const activeVoices = {};

  const MASTER_GAIN = 0.4;
  const MIX_HEADROOM = 0.9;
  const RELEASE_TC = 0.06;  
  const EPS = 0.0001;

  startBtn.addEventListener("click", async () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      globalGain = audioCtx.createGain();
      globalGain.gain.setValueAtTime(MASTER_GAIN, audioCtx.currentTime);
      globalGain.connect(audioCtx.destination);
    }

    await audioCtx.resume();
  });

  window.addEventListener("keydown", keyDown, false);
  window.addEventListener("keyup", keyUp, false);

  function updateVoiceGains() {
    const keys = Object.keys(activeVoices);
    const n = Math.max(keys.length, 1);
    const perVoice = MIX_HEADROOM / n;
    const now = audioCtx.currentTime;

    keys.forEach((k) => {
      activeVoices[k].voiceGain.gain.setTargetAtTime(perVoice, now, 0.01);
    });
  }
//the creative part - i wanna change the colors on every key based on the frequency! 
  function setBackground(freq) {
    const t = Date.now() / 1000;
    const hue = Math.floor((Math.log2(freq) * 97 + t * 25) % 360);
    document.body.style.backgroundColor = `hsl(${hue} 55% 14%)`;
  }

  function keyDown(event) {
    if (!audioCtx) return;
    if (event.repeat) return;

    const key = (event.keyCode || event.which).toString();

    if (keyboardFrequencyMap[key] && !activeVoices[key]) {
      playNote(key);
    }
  }

  function keyUp(event) {
    if (!audioCtx) return;

    const key = (event.keyCode || event.which).toString();

    if (keyboardFrequencyMap[key] && activeVoices[key]) {
      stopNote(key);
    }
  }

  function playNote(key) {
    const freq = keyboardFrequencyMap[key];
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    osc.type = waveformSelect.value;
    osc.frequency.setValueAtTime(freq, now);

    const envGain = audioCtx.createGain();
    envGain.gain.setValueAtTime(EPS, now);
    envGain.gain.exponentialRampToValueAtTime(1.0, now + 0.01);

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
