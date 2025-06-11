document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const slides = Array.from(container.children);
  const N = slides.length;
  const slideWidth = slides[0].offsetWidth + parseInt(getComputedStyle(slides[0]).marginRight);
  const totalWidth = slideWidth * N;

  // duplicate for infinite effect
  slides.forEach(slide => container.append(slide.cloneNode(true)));
  slides.forEach(slide => container.insertBefore(slide.cloneNode(true), container.firstChild));

  // center on original slides
  container.scrollLeft = totalWidth;

  // wrap on scroll
  container.addEventListener('scroll', () => {
    if (container.scrollLeft <= 0) {
      container.scrollLeft += totalWidth;
    } else if (container.scrollLeft >= totalWidth * 2) {
      container.scrollLeft -= totalWidth;
    }
  });

  // arrow buttons
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    container.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    container.scrollBy({ left: slideWidth, behavior: 'smooth' });
  });
});
