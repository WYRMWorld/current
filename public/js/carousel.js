document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.js-flickity');
  const flkty = new Flickity(carousel);

  // Build SoundCloud widget instances
  const widgets = Array.from(carousel.querySelectorAll('iframe'))
    .map(iframe => SC.Widget(iframe));

  // On staticClick (click without drag), toggle play/pause
  flkty.on('staticClick', (event, pointer, cellElem, cellIndex) => {
    if (cellIndex !== undefined) {
      widgets[cellIndex].toggle();
    }
  });
});
