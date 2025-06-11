document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const iframes = container.querySelectorAll('iframe');
  let loadedCount = 0;

  // Wait for all iframes to load
  iframes.forEach(iframe => {
    iframe.addEventListener('load', () => {
      loadedCount++;
      if (loadedCount === iframes.length) {
        waitForStableTrackItems(initCarousel);
      }
    });
  });

  function waitForStableTrackItems(callback) {
    const trackItem = container.querySelector('.track-item');
    let lastWidth = trackItem.offsetWidth;
    let lastHeight = trackItem.offsetHeight;
    let stableCount = 0;
    const requiredStableFrames = 10; // ~500ms of stability

    function poll() {
      let curWidth = trackItem.offsetWidth;
      let curHeight = trackItem.offsetHeight;
      if (curWidth === lastWidth && curHeight === lastHeight) {
        stableCount++;
        if (stableCount >= requiredStableFrames) {
          callback();
          return;
        }
      } else {
        stableCount = 0;
        lastWidth = curWidth;
        lastHeight = curHeight;
      }
      setTimeout(poll, 50);
    }
    poll();
  }

  function initCarousel() {
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

    // Prevent wrap logic from firing repeatedly
    let isAdjusting = false;
    container.addEventListener('scroll', () => {
      if (isAdjusting) return;
      const { start, end } = getScrollRange();
      if (container.scrollLeft < start) {
        isAdjusting = true;
        container.scrollLeft += slideW * count;
        setTimeout(() => { isAdjusting = false; }, 10);
      } else if (container.scrollLeft >= end) {
        isAdjusting = true;
        container.scrollLeft -= slideW * count;
        setTimeout(() => { isAdjusting = false; }, 10);
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
  }
});
