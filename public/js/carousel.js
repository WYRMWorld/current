const container = document.querySelector('.track-scroll');
const slides    = Array.from(container.children);

// clone for infinite loop
slides.forEach(slide => {
  container.appendChild(slide.cloneNode(true));
  container.insertBefore(slide.cloneNode(true), container.firstChild);
});

let pos = 0, vel = 0, drag = false, startX = 0;

// set initial position
container.style.transform = `translateX(${pos}px)`;

// overlay elements
const overlays = document.querySelectorAll('.drag-overlay');

overlays.forEach((ov) => {
  ov.addEventListener('mousedown', e => {
    drag = true;
    startX = e.clientX;
    // deactivate overlays so iframes become clickable mid-drag
    overlays.forEach(o => o.parentElement.classList.add('overlay-active'));
  });
});

window.addEventListener('mousemove', e => {
  if (!drag) return;
  const dx = e.clientX - startX;
  startX = e.clientX;
  pos += dx;
  vel = dx;
});

window.addEventListener('mouseup', e => {
  drag = false;
  overlays.forEach(o => o.parentElement.classList.remove('overlay-active'));
});

(function loop(){
  if (!drag) {
    pos += vel;
    vel *= 0.9;
    const w     = slides[0].offsetWidth;
    const total = w * slides.length;
    if (pos > -w)        pos -= total;
    if (pos < -total*2)  pos += total;
  }
  container.style.transform = `translateX(${pos}px)`;
  requestAnimationFrame(loop);
})();
