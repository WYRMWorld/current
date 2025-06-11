document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const originals = Array.from(container.children);
  const count     = originals.length;
  const style     = getComputedStyle(originals[0]);
  const marginR   = parseInt(style.marginRight);
  const slideW    = originals[0].offsetWidth + marginR;
  const totalW    = slideW * count;

  // 1) Clone BEFORE originals in correct order
  originals.slice().reverse().forEach(slide => {
    container.insertBefore(slide.cloneNode(true), container.firstChild);
  });
  // 2) Clone AFTER originals
  originals.forEach(slide => {
    container.appendChild(slide.cloneNode(true));
  });

  // 3) Jump to the “real” start
  container.scrollLeft = totalW;

  // 4) Wrap-around without snapping
  container.addEventListener('scroll', () => {
    if (container.scrollLeft <= slideW) {
      container.scrollLeft += totalW;
    }
    else if (container.scrollLeft >= totalW * 2) {
      container.scrollLeft -= totalW;
    }
  });

  // 5) Drag-to-scroll setup
  let isDown    = false;
  let startX    = 0;
  let scrollStart = 0;

  // set initial cursor style
  container.style.cursor = 'grab';

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollStart = container.scrollLeft;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });
  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });
  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - startX;
    container.scrollLeft = scrollStart - walk;
  });

  // 6) Arrow controls
  document.querySelector('.carousel-arrow.left')
    .addEventListener('click', () => {
      container.scrollBy({ left: -slideW, behavior: 'smooth' });
    });
  document.querySelector('.carousel-arrow.right')
    .addEventListener('click', () => {
      container.scrollBy({ left:  slideW, behavior: 'smooth' });
    });
});
