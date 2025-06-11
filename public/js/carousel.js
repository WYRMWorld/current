document.addEventListener('DOMContentLoaded', () => {
  const viewport = document.querySelector('.viewport');
  const track    = document.querySelector('.track');
  const originals= Array.from(track.children);
  const count    = originals.length;
  const style    = getComputedStyle(originals[0]);
  const itemW    = originals[0].offsetWidth + parseInt(style.marginRight);
  let pos        = -count * itemW;   // start in the “middle”
  let isDown     = false;
  let startX     = 0;
  let startPos   = 0;
  let raf;

  // 1) Build new order: [after-clones][originals][before-clones]
  const afterClones  = originals.map(i => i.cloneNode(true));
  const beforeClones = originals.map(i => i.cloneNode(true));
  track.innerHTML = '';
  // append after-clones first
  afterClones.forEach(el => track.appendChild(el));
  // then originals
  originals.forEach(el => track.appendChild(el));
  // then before-clones
  beforeClones.forEach(el => track.appendChild(el));

  // 2) Position at first original
  track.style.transform = `translateX(${pos}px)`;

  // 3) Wrap logic
  function wrap() {
    // if we've dragged into the first copy-block (afterClones)
    if (pos > -itemW) {
      pos -= count * itemW;
    }
    // if we've dragged into the last copy-block (beforeClones)
    else if (pos < -count * itemW * 2) {
      pos += count * itemW;
    }
  }

  // 4) Animation loop
  function loop() {
    track.style.transform = `translateX(${pos}px)`;
    wrap();
    raf = requestAnimationFrame(loop);
  }

  // 5) Pointer drag on the viewport for smooth capture
  viewport.addEventListener('pointerdown', e => {
    isDown   = true;
    startX   = e.clientX;
    startPos = pos;
    cancelAnimationFrame(raf);
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointerup', e => {
    isDown = false;
    viewport.releasePointerCapture(e.pointerId);
    loop(); // resume infinite loop
  });
  viewport.addEventListener('pointermove', e => {
    if (!isDown) return;
    pos = startPos + (e.clientX - startX);
    track.style.transform = `translateX(${pos}px)`;
  });

  // 6) Arrow controls
  document.querySelector('.arrow.left').addEventListener('click', () => {
    pos += itemW;
    track.style.transition = 'transform 0.3s';
    track.style.transform  = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  });
  document.querySelector('.arrow.right').addEventListener('click', () => {
    pos -= itemW;
    track.style.transition = 'transform 0.3s';
    track.style.transform  = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  });

  // 7) Start the loop
  loop();
});
