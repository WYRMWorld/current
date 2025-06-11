document.addEventListener('DOMContentLoaded', () => {
  const track     = document.querySelector('.track');
  const items     = Array.from(track.children);
  const count     = items.length;
  const itemW     = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight);
  let pos         = -count * itemW;   // start in middle
  let isDown      = false;
  let startX      = 0;
  let startPos    = 0;
  let rafId;

  // 1) Clone items on both ends
  const cloneBefore = items.map(el => el.cloneNode(true));
  const cloneAfter  = items.map(el => el.cloneNode(true));
  cloneBefore.reverse().forEach(el => track.insertBefore(el, track.firstChild));
  cloneAfter.forEach(el => track.appendChild(el));

  // 2) Set initial position
  track.style.transform = `translateX(${pos}px)`;

  // 3) Wrap function
  function wrap() {
    if (pos > -itemW) {
      pos -= count * itemW;
    } else if (pos < -count * itemW * 2) {
      pos += count * itemW;
    }
    track.style.transform = `translateX(${pos}px)`;
  }

  // 4) Animation frame loop for smooth drag
  function animate() {
    track.style.transform = `translateX(${pos}px)`;
    wrap();
    rafId = requestAnimationFrame(animate);
  }

  // 5) Pointer events for drag
  track.addEventListener('pointerdown', e => {
    isDown   = true;
    startX   = e.clientX;
    startPos = pos;
    cancelAnimationFrame(rafId);
  });
  window.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    animate();  // resume wrapping & position
  });
  track.addEventListener('pointermove', e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    pos = startPos + dx;
    track.style.transform = `translateX(${pos}px)`;
  });

  // 6) Arrow Controls
  document.querySelector('.arrow.left').addEventListener('click', () => {
    pos += itemW;
    track.style.transition = 'transform 0.3s';
    track.style.transform = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  });
  document.querySelector('.arrow.right').addEventListener('click', () => {
    pos -= itemW;
    track.style.transition = 'transform 0.3s';
    track.style.transform = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  });

  // 7) Kick off the loop
  animate();
});
