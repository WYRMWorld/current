document.addEventListener('DOMContentLoaded', () => {
  new Flickity('.js-flickity', {
    cellAlign: 'left',
    contain: true,
    wrapAround: true,
    freeScroll: true,
    prevNextButtons: true,
    pageDots: false,
    selectedAttraction: 0.01,
    friction: 0.15,
  });
});
