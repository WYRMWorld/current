document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const leftArrow = document.querySelector('.carousel-arrow.left');
  const rightArrow = document.querySelector('.carousel-arrow.right');
  let isDown = false, startX = 0, scrollStart = 0;

  // Force scroll to 0 at start
  container.scrollLeft = 0;

  // Drag-to-scroll
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

  // Infinite loop by rotating children when scrolled too far
  const itemWidth = 300 + 16; // match your CSS (width + margin-right)
  function rotateLeft() {
    // If scrolled left past threshold, move last to front
    if (container.scrollLeft < itemWidth / 2) {
      container.insertBefore(container.lastElementChild, container.firstElementChild);
      container.scrollLeft += itemWidth;
    }
  }
  function rotateRight() {
    // If scrolled right past threshold, move first to end
    if (container.scrollLeft > itemWidth * (container.children.length - 2)) {
      container.appendChild(container.firstElementChild);
      container.scrollLeft -= itemWidth;
    }
  }
  container.addEventListener('scroll', () => {
    rotateLeft();
    rotateRight();
  });

  // Arrow controls
  leftArrow.addEventListener('click', () => {
    container.scrollBy({ left: -itemWidth, behavior: 'smooth' });
    setTimeout(rotateLeft, 500);
  });
  rightArrow.addEventListener('click', () => {
    container.scrollBy({ left: itemWidth, behavior: 'smooth' });
    setTimeout(rotateRight, 500);
  });
});
