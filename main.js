// public/main.js
const canvas = document.getElementById('wave');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#00c9a7';
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 200; i++) {
    const h = Math.sin(Date.now() * 0.002 + i * 0.1) * 50 + 100;
    ctx.fillRect(i * 4, 100 - h / 2, 2, h);
  }
  requestAnimationFrame(draw);
}
draw();
