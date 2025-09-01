import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAiepIKyMHxYzOQ2cqaQboNmdxlSgXZr5o",
  authDomain: "soriwebsite.firebaseapp.com",
  databaseURL: "https://soriwebsite-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "soriwebsite",
  storageBucket: "soriwebsite.appspot.com",
  messagingSenderId: "471550358792",
  appId: "1:471550358792:web:210ba8b121660ce354e8bd",
  measurementId: "G-J4DK0EK60V"
};

const app = initializeApp(firebaseConfig);

  // --- waveform code ---
window.addEventListener('DOMContentLoaded', () => {
  const audio = document.querySelector('audio');
  const canvas = document.getElementById('waveform');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let audioCtx, analyser, bufferLength, dataArray, source;
  let prevDataArray = null;

  audio.addEventListener('play', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      bufferLength = analyser.fftSize;
      dataArray = new Uint8Array(bufferLength);
      prevDataArray = new Uint8Array(bufferLength);
      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    drawFFT();
  });

  function drawFFT() {
    if (audio.paused) return;
    requestAnimationFrame(drawFFT);
    analyser.getByteFrequencyData(dataArray);

    // Smoothing
    for (let i = 0; i < bufferLength; i++) {
      prevDataArray[i] = prevDataArray[i] * 0.7 + dataArray[i] * 0.3;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Group FFT data to fewer bars
    const numBars = 300;
const gap = 2; // pixels between bars
const barWidth = (canvas.width - gap * (numBars - 1)) / numBars;

for (let i = 0; i < numBars; i++) {
  let sum = 0;
  const groupSize = Math.floor(bufferLength / numBars);
  for (let j = 0; j < groupSize; j++) {
    sum += prevDataArray[i * groupSize + j];
  }
  const avg = sum / groupSize;
  const barHeight = avg * canvas.height / 256;
  ctx.fillStyle = '#00ffe1ff';
  ctx.fillRect(i * (barWidth + gap), canvas.height - barHeight, barWidth, barHeight);
}
  }
  // --- message board code ---
  const db = getDatabase(app);
  const messagesRef = ref(db, 'messages');
  const form = document.getElementById('msg-form');
  const usernameInput = document.getElementById('username-input');
  const input = document.getElementById('msg-input');
  const list = document.getElementById('msg-list');

  // Display all messages
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    const li = document.createElement('li');
    const time = new Date(msg.timestamp).toLocaleString();
    li.textContent = `[${time}] ${msg.username}: ${msg.text}`;
    list.appendChild(li);
  });

  // Add new message
  form.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const text = input.value.trim();
  if (username && text) {
    push(messagesRef, {
      username,
      text,
      timestamp: Date.now()
    });
    input.value = '';
  }
  });
});