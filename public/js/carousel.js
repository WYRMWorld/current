document.addEventListener('DOMContentLoaded', () => {
  const carouselElem = document.querySelector('.js-flickity');
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

  // Build SoundCloud Widget instances
  const widgets = flkty.cells.map(cell => {
    const iframe = cell.element.querySelector('iframe');
    return SC.Widget(iframe);
  });

  // Always disable iframe events so drag stays smooth
  carouselElem.querySelectorAll('iframe').forEach(f => {
    f.style.pointerEvents = 'none';
  });

  // On click (staticClick), toggle play/pause
  flkty.on('staticClick', (event, pointer, cellElem, cellIndex) => {
    if (cellIndex !== undefined) {
      widgets[cellIndex].toggle();
    }
  });
});
