document.addEventListener('DOMContentLoaded', function () {
  new Splide('#splide', {
    type      : 'loop',
    perPage   : 4,          // adjust # visible
    perMove   : 1,
    gap       : '1rem',
    drag      : true,
    arrows    : true,
    pagination: false,
    speed     : 600,
    snap      : false,      // free drag
    focus     : 'center',
  }).mount();
});
