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

//color picker and clear button logic
const colorPicker = document.getElementById('color-picker');
const clearBtn = document.getElementById('clear-btn');

let drawColor = colorPicker.value;

colorPicker.addEventListener('input', (e) => {
  drawColor = e.target.value;
});


  // --- waveform code ---
window.addEventListener('DOMContentLoaded', () => {
  const audio = document.querySelector('audio');
  const canvas = document.getElementById('waveform');
  const ctx = canvas.getContext('2d');
  const drawCanvas = document.getElementById('draw-canvas');
  const drawCtx = drawCanvas.getContext('2d');


  function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas(canvas);
  resizeCanvas(drawCanvas);

  window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    resizeCanvas(drawCanvas);
  });

  // ...rest of your code...
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
    const numBars = 75;
const gap = 10; // pixels between bars
const barWidth = (canvas.width - gap * (numBars - 1)) / numBars;

for (let i = 0; i < numBars; i++) {
  let sum = 0;
  const groupSize = Math.floor(bufferLength / numBars);
  for (let j = 0; j < groupSize; j++) {
    sum += prevDataArray[i * groupSize + j];
  }
  const avg = sum / groupSize;
  const barHeight = avg * canvas.height / 256;
  ctx.fillStyle = '#00564cff';
  ctx.fillRect(i * (barWidth + gap), canvas.height - barHeight, barWidth, barHeight);
}
  }
  // --- message board code ---
  const db = getDatabase(app);
  const drawDb = ref(db, 'drawings');
  const messagesRef = ref(db, 'messages');
  const form = document.getElementById('msg-form');
  const usernameInput = document.getElementById('username-input');
  const input = document.getElementById('msg-input');
  const list = document.getElementById('msg-list');
  const usernameColors = {};

  function getUsernameColor(username) {
  if (!usernameColors[username]) {
    // Generate a random pastel color
    const hue = Math.floor(Math.random() * 360);
    usernameColors[username] = `hsl(${hue}, 70%, 60%)`;
  }
  return usernameColors[username];
}
  // Display all messages
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    const li = document.createElement('li');
    const time = new Date(msg.timestamp).toLocaleString();

    // Create username span with color
    const userSpan = document.createElement('span');
    userSpan.textContent = msg.username;
    userSpan.style.color = getUsernameColor(msg.username);
    userSpan.style.fontWeight = 'bold';

    li.textContent = `[${time}]`;
    li.appendChild(userSpan);
    li.appendChild(document.createTextNode(`: ${msg.text}`));
    list.insertBefore(li, list.firstChild);
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
  // drawing logic
  let drawing = false;

drawCanvas.addEventListener('mousedown', (e) => {
  const rect = drawCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (e.target !== drawCanvas) return;
  drawing = true;
  drawCanvas.classList.add('drawing');
  drawCtx.beginPath();
  drawCtx.moveTo(e.clientX, e.clientY);
   push(drawDb, {
    x: e.clientX,
    y: e.clientY,
    color: drawColor,
    start: true
  });
});

drawCanvas.addEventListener('mousemove', (e) => {
  if (drawing) {
    const x = e.clientX;
    const y = e.clientY;
    drawCtx.lineTo(e.clientX, e.clientY);
    drawCtx.strokeStyle = drawColor;
    drawCtx.lineWidth = 3;
    drawCtx.stroke();
    push(drawDb, {
      x, y, color: drawColor
    });
  }
});

drawCanvas.addEventListener('mouseup', () => {
  drawing = false;
  drawCanvas.classList.remove('drawing'); 
});

drawCanvas.addEventListener('mouseleave', () => {
  drawing = false;
  drawCanvas.classList.remove('drawing'); 
});

clearBtn.addEventListener('click', () => {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  push(drawDb, { clear: true });   // broadcast the clear
});

onChildAdded(drawDb, (snapshot) => {
  const data = snapshot.val();

  if (data.clear) {                // <-- new branch
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    return;
  }
  const { x, y, color, start } = snapshot.val();
  if (start) {
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
  } else {
    drawCtx.lineTo(x, y);
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 3;
    drawCtx.stroke();
  }
});
});
