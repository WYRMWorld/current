document.addEventListener('DOMContentLoaded', () => {
  const wrapper   = document.querySelector('.carousel-wrapper');
  const container = document.querySelector('.track-scroll');
  const slides    = Array.from(container.children);

  // Clone for infinite loop
  slides.forEach(s => {
    container.appendChild(s.cloneNode(true));
    container.insertBefore(s.cloneNode(true), container.firstChild);
  });

  let pos = 0;
  let vel = 0;
  let drag = false;
  let startX = 0;
  const w = slides[0].offsetWidth;
  const total = w * slides.length;

  // Apply initial transform
  container.style.transform = `translateX(${pos}px)`;

  // Drag anywhere in wrapper
  wrapper.addEventListener('mousedown', e => {
    drag = true;
    startX = e.clientX;
    wrapper.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - startX;
    startX = e.clientX;
    pos += dx;
    vel = dx;
    // apply wrap immediately during drag
    if (pos > -w)        pos -= total;
    if (pos < -total*2)  pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });

  window.addEventListener('mouseup', () => {
    drag = false;
    wrapper.style.cursor = '';
  });

  // Arrow controls
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    pos += w;
    if (pos > -w)        pos -= total;
    if (pos < -total*2)  pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    pos -= w;
    if (pos > -w)        pos -= total;
    if (pos < -total*2)  pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });

  // Inertia + continuous wrap
  (function loop(){
    if (!drag) {
      pos += vel;
      vel *= 0.9;
    }
    // always wrap, even if dragging stopped mid‐wrap
    if (pos > -w)        pos -= total;
    if (pos < -total*2)  pos += total;
    container.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(loop);
  })();
});
