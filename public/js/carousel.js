document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const slides    = Array.from(container.children);
  const N         = slides.length;
  const style     = getComputedStyle(slides[0]);
  const slideWidth = slides[0].offsetWidth + parseInt(style.marginRight);
  const totalWidth = slideWidth * N;

  // 1) Clone slides before & after
  slides.forEach(slide => container.append(slide.cloneNode(true)));
  slides.forEach(slide => container.insertBefore(slide.cloneNode(true), container.firstChild));

  // 2) Center on the original slides
  container.scrollLeft = totalWidth;

  // 3) Wrap on scroll
  container.addEventListener('scroll', () => {
    if (container.scrollLeft <= 0) {
      container.scrollLeft += totalWidth;
    } else if (container.scrollLeft >= totalWidth * 2) {
      container.scrollLeft -= totalWidth;
    }
  });

  // 4) Native drag-to-scroll
  let isDown     = false;
  let startX     = 0;
  let scrollLeft = 0;

  container.addEventListener('mousedown', e => {
    isDown     = true;
    startX     = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.style.cursor = '';
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = '';
  });

  container.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - container.offsetLeft;
    const walk = x - startX;
    container.scrollLeft = scrollLeft - walk;
  });

  // 5) Arrow buttons
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    container.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    container.scrollBy({ left: slideWidth, behavior: 'smooth' });
  });
});
