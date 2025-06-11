document.addEventListener('DOMContentLoaded', function () {
  new Splide('.splide', {
    type      : 'loop',
    perPage   : 3,          // adjust how many are visible
    perMove   : 1,
    gap       : '1rem',
    padding   : 0,
    drag      : true,
    arrows    : true,
    pagination: false,
    speed     : 600,
    snap      : false,      // free-drag, no snap lock
    focus     : 'center',
  }).mount();
});
