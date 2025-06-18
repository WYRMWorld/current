document.addEventListener('DOMContentLoaded', () => {
  const carouselElem = document.querySelector('.carousel.js-flickity');
  if (!carouselElem) return;

  const flkty = new Flickity(carouselElem, {
    wrapAround: true,
    freeScroll: true,
    contain: true,
    draggable: true,
    prevNextButtons: true,
    pageDots: false,
    cellAlign: 'left'
  });

  const widgets = Array.from(carouselElem.querySelectorAll('iframe'))
    .map(iframe => SC.Widget(iframe));

  // CORRECTED: This logic now correctly toggles the overlay during drag
  flkty.on('dragStart', () => {
    carouselElem.classList.add('is-dragging');
  });

  flkty.on('dragEnd', () => {
    carouselElem.classList.remove('is-dragging');
  });

  flkty.on('staticClick', (event, pointer, cellElement, cellIndex) => {
    if (typeof cellIndex === 'number') {
      widgets[cellIndex].toggle();
    }
  });

  widgets.forEach((widget, index) => {
    widget.bind(SC.Widget.Events.PLAY, () => {
      widgets.forEach((otherWidget, otherIndex) => {
        if (index !== otherIndex) {
          otherWidget.pause();
        }
      });
    });
  });
});