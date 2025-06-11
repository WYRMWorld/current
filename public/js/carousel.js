const container = document.querySelector('.track-scroll');
const slides = Array.from(container.children);
slides.forEach(s => { container.append(s.cloneNode(true)); container.prepend(s.cloneNode(true)); });
let pos = -container.offsetWidth, vel = 0, drag = false, startX = 0;
container.style.transform = `translateX(${pos}px)`;
(function loop(){
  if(!drag){ pos += vel; vel *= 0.9;
    const w = slides[0].offsetWidth, total = w * slides.length;
    if(pos > -w) pos -= total; if(pos < -total*2) pos += total;
  }
  container.style.transform = `translateX(${pos}px)`;
  requestAnimationFrame(loop);
})();
container.addEventListener('mousedown', e => { drag = true; startX = e.clientX; });
window.addEventListener('mousemove', e => { if(!drag) return; const dx = e.clientX - startX; startX = e.clientX; pos += dx; vel = dx; });
window.addEventListener('mouseup', () => { drag = false; });