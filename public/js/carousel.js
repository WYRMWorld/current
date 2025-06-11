document.addEventListener('DOMContentLoaded', () => {
  const container  = document.querySelector('.track-scroll');
  const leftArrow  = document.querySelector('.carousel-arrow.left');
  const rightArrow = document.querySelector('.carousel-arrow.right');
  const originals  = Array.from(container.children);
  const count      = originals.length;
  const itemWidth  = 300 + 16; // fixed in your CSS

  // 1) Clone before & after
  originals.forEach(item => container.appendChild(item.cloneNode(true)));
  originals.slice().reverse().forEach(item => container.insertBefore(item.cloneNode(true), container.firstChild));

  // 2) Position at the *start* of the original tracks
  container.scrollLeft = itemWidth * count;

  // 3) Simplified infinite‐loop scroll logic
  let isAdjusting = false;
  container.addEventListener('scroll', () => {
    if (isAdjusting) return;
    const fullBuffer = itemWidth * count;
    const maxScroll  = fullBuffer * 2;
    const s = container.scrollLeft;

    if (s <= 0) {
      isAdjusting = true;
      container.scrollLeft = s + fullBuffer;
      requestAnimationFrame(() => { isAdjusting = false });
    }
    else if (s >= maxScroll) {
      isAdjusting = true;
      container.scrollLeft = s - fullBuffer;
      requestAnimationFrame(() => { isAdjusting = false });
    }
  });

  // 4) Drag‐to‐scroll (unchanged)
  let isDown = false, startX = 0, scrollStart = 0;
  container.style.cursor = 'grab';
  container.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.clientX;
    scrollStart = container.scrollLeft;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });
  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.style.cursor = 'grab';
  });
  container.addEventListener('mousemove', e => {
    if (!isDown) return;
    container.scrollLeft = scrollStart - (e.clientX - startX);
  });

  // 5) Arrow controls (unchanged)
  leftArrow.addEventListener('click', () => container.scrollBy({ left: -itemWidth, behavior: 'smooth' }));
  rightArrow.addEventListener('click', () => container.scrollBy({ left:  itemWidth, behavior: 'smooth' }));
});
