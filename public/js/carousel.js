document.addEventListener('DOMContentLoaded', () => {
  const carouselElem = document.querySelector('.js-flickity');
  const iframes = carouselElem.querySelectorAll('iframe');

  const flkty = new Flickity(carouselElem, {
    cellAlign:         'left',
    contain:           true,
    wrapAround:        true,
    freeScroll:        true,
    draggable:         true,
    prevNextButtons:   true,
    pageDots:          false,
    selectedAttraction:0.01,
    friction:          0.15,
  });

  flkty.on('dragStart', () => {
    iframes.forEach(f => f.style.pointerEvents = 'none');
  });
  flkty.on('dragEnd', () => {
    iframes.forEach(f => f.style.pointerEvents = 'auto');
  });
});
