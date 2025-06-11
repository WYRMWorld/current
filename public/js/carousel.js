document.addEventListener('DOMContentLoaded', () => {
  const container  = document.querySelector('.track-scroll');
  const slides     = Array.from(container.children);
  const N          = slides.length;
  const style      = getComputedStyle(slides[0]);
  const slideWidth = slides[0].offsetWidth + parseInt(style.marginRight);
  const totalW     = slideWidth * N;

  // Clone slides both ends
  slides.forEach(s => container.append(s.cloneNode(true)));
  slides.forEach(s => container.insertBefore(s.cloneNode(true), container.firstChild));

  // Start in the middle
  container.scrollLeft = totalW;

  // Wrap when crossing half-way into clones
  container.addEventListener('scroll', () => {
    const sl = container.scrollLeft;
    if (sl < totalW * 0.5)       container.scrollLeft = sl + totalW;
    if (sl > totalW * 1.5)       container.scrollLeft = sl - totalW;
  });

  // Drag via the overlays
  let isDown = false, startX = 0, scrollStart = 0;
  document.querySelectorAll('.drag-overlay').forEach(ov => {
    ov.addEventListener('mousedown', e => {
      isDown     = true;
      startX     = e.pageX - container.offsetLeft;
      scrollStart = container.scrollLeft;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    });
  });

  window.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = '';
  });

  window.addEventListener('mousemove', e => {
    if (!isDown) return;
    const x = e.pageX - container.offsetLeft;
    const walk = x - startX;
    container.scrollLeft = scrollStart - walk;
  });

  // Arrow clicks
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    container.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    container.scrollBy({ left: slideWidth, behavior: 'smooth' });
  });
});
