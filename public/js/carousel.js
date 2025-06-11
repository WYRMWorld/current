document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const originals = Array.from(container.children);
  const count = originals.length;
  const style = getComputedStyle(originals[0]);
  const marginR = parseInt(style.marginRight);
  const slideW = originals[0].offsetWidth + marginR;

  // Clone originals before and after
  originals.forEach(item => container.appendChild(item.cloneNode(true)));
  originals.slice().reverse().forEach(item => container.insertBefore(item.cloneNode(true), container.firstChild));

  // Jump to the first original (not the clones)
  container.scrollLeft = slideW * count;

  function getScrollRange() {
    return {
      start: slideW * count,
      end: slideW * count * 2,
    };
  }

  container.addEventListener('scroll', () => {
    const { start, end } = getScrollRange();
    if (container.scrollLeft < start) {
      // Too far left; jump to the originals (from right clones)
      container.scrollLeft += slideW * count;
    } else if (container.scrollLeft >= end) {
      // Too far right; jump to the originals (from left clones)
      container.scrollLeft -= slideW * count;
    }
  });

  // Drag-to-scroll (mouse)
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
    const walk = e.clientX - startX;
    container.scrollLeft = scrollStart - walk;
  });

  // Arrow controls
  document.querySelector('.carousel-arrow.left')
    .addEventListener('click', () => container.scrollBy({ left: -slideW, behavior: 'smooth' }));
  document.querySelector('.carousel-arrow.right')
    .addEventListener('click', () => container.scrollBy({ left: slideW, behavior: 'smooth' }));
});
