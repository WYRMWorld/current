const container = document.querySelector('.track-scroll');
const slides = Array.from(container.children);

// Clone for infinite loop
slides.forEach(slide => {
  container.appendChild(slide.cloneNode(true));
  container.insertBefore(slide.cloneNode(true), container.firstChild);
});

let pos = -container.offsetWidth;
let vel = 0, dragging = false, startX = 0;
container.style.transform = `translateX(${pos}px)`;

function loop() {
  if (!dragging) {
    pos += vel;
    vel *= 0.9;
    const w = slides[0].offsetWidth;
    const total = w * slides.length;
    if (pos > -w) pos -= total;
    if (pos < -total * 2) pos += total;
  }
  container.style.transform = `translateX(${pos}px)`;
  requestAnimationFrame(loop);
}

container.addEventListener('mousedown', e => { dragging = true; startX = e.clientX; });
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = e.clientX - startX;
  startX = e.clientX;
  pos += dx; vel = dx;
});
window.addEventListener('mouseup', () => { dragging = false; });

document.addEventListener('DOMContentLoaded', loop);
