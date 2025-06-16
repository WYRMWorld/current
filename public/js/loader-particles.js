// loader-particles.js
// Fully self-contained, no placeholders

function initializeParticleLoader() {
  if (typeof particlesJS !== 'function') return;
  particlesJS('loader-particles', {
    particles: {
      number:      { value: 80, density: { enable: true, value_area: 800 } },
      color:       { value: ['#00ff9e','#ff1493'] },
      shape:       { type: 'circle' },
      opacity:     { value: 0.8, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
      size:        { value: 4, random: true },
      line_linked: { enable: false },
      move:        { enable: true, speed: 2, random: true, out_mode: 'out' }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
        resize:  true
      }
    },
    retina_detect: true
  });
}

initializeParticleLoader();
