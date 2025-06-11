document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const slides    = Array.from(container.children);
  const N         = slides.length;
  const style     = getComputedStyle(slides[0]);
  const slideW    = slides[0].offsetWidth + parseInt(style.marginRight);
  const totalW    = slideW * N;

  // Clone for infinite loop
  slides.forEach(s => container.append(s.cloneNode(true)));
  slides.forEach(s => container.insertBefore(s.cloneNode(true), container.firstChild));

  // Center start
  container.scrollLeft = totalW;

  // Wrap logic
  container.addEventListener('scroll', () => {
    if (container.scrollLeft <= slideW * 0.5) {
      container.scrollLeft += totalW;
    } else if (container.scrollLeft >= totalW * 1.5) {
      container.scrollLeft -= totalW;
    }
  });

  // Native drag
  let isDown     = false;
  let startX     = 0;
  let scrollLeft = 0;
  const doDrag = e => {
    if (!isDown) return;
    e.preventDefault();
    const x   = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };
  container.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = '';
  });
  window.addEventListener('mousemove', doDrag);

  // Arrow controls
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    container.scrollBy({ left: -slideW, behavior: 'smooth' });
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    container.scrollBy({ left: slideW, behavior: 'smooth' });
  });
});
