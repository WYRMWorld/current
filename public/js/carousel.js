document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const originals = Array.from(container.children);
  const count     = originals.length;

  // Measure one “slide” width (item + right-margin)
  const style   = getComputedStyle(originals[0]);
  const marginR = parseInt(style.marginRight);
  const slideW  = originals[0].offsetWidth + marginR;
  const totalW  = slideW * count;

  // 1) Clone originals before & after (keeping forward order)
  originals.slice().reverse().forEach(item => {
    container.insertBefore(item.cloneNode(true), container.firstChild);
  });
  originals.forEach(item => {
    container.appendChild(item.cloneNode(true));
  });

  // 2) Jump to the real start (so you’re in the middle set)
  container.scrollLeft = totalW;

  // 3) Wrap thresholds: once you drift too far into a clone set,
  //    jump you back by +/- totalW so that the loop is infinite
  const minScroll = totalW - slideW;
  const maxScroll = totalW * 2 + slideW;
  container.addEventListener('scroll', () => {
    if (container.scrollLeft < minScroll) {
      container.scrollLeft += totalW;
    } else if (container.scrollLeft > maxScroll) {
      container.scrollLeft -= totalW;
    }
  });

  // 4) DRAG-TO-SCROLL (correct clientX offsets)
  let isDown      = false;
  let startX      = 0;
  let scrollStart = 0;

  container.style.cursor = 'grab';

  container.addEventListener('mousedown', e => {
    isDown       = true;
    startX       = e.clientX;
    scrollStart  = container.scrollLeft;
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

  // 5) Arrow controls remain unchanged
  document.querySelector('.carousel-arrow.left')
    .addEventListener('click', () => {
      container.scrollBy({ left: -slideW, behavior: 'smooth' });
    });
  document.querySelector('.carousel-arrow.right')
    .addEventListener('click', () => {
      container.scrollBy({ left:  slideW, behavior: 'smooth' });
    });
});
