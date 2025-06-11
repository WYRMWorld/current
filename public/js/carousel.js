document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  const slides    = Array.from(container.children);
  const N         = slides.length;
  const slideWidth = slides[0].offsetWidth + parseInt(getComputedStyle(slides[0]).marginRight);
  
  // Clone slides before & after
  slides.forEach(s => {
    container.append(s.cloneNode(true));
    container.prepend(s.cloneNode(true));
  });

  const totalSlides = container.children.length;
  const scrollCenter = N * slideWidth;
  container.scrollLeft = scrollCenter;

  // On scroll, wrap when reaching edges
  container.addEventListener('scroll', () => {
    if (container.scrollLeft <= 0) {
      container.scrollLeft += N * slideWidth;
    } else if (container.scrollLeft >= (totalSlides - N) * slideWidth) {
      container.scrollLeft -= N * slideWidth;
    }
  });

  // Arrow controls
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    container.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    container.scrollBy({ left: slideWidth, behavior: 'smooth' });
  });
});
