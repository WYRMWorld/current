document.addEventListener('DOMContentLoaded', () => {
  const track    = document.querySelector('.track');
  const items    = Array.from(track.children);
  const count    = items.length;
  const style    = getComputedStyle(items[0]);
  const itemW    = items[0].offsetWidth + parseInt(style.marginRight);
  let pos        = -count * itemW;   // start in the middle
  let isDown     = false, startX = 0, startPos = 0, raf;

  // 1) Clone both ends
  const before = items.map(i => i.cloneNode(true)).reverse();
  const after  = items.map(i => i.cloneNode(true));
  before.forEach(i => track.insertBefore(i, track.firstChild));
  after.forEach(i => track.appendChild(i));

  // 2) Apply initial transform
  track.style.transform = `translateX(${pos}px)`;

  // 3) Wrap logic
  function wrap() {
    if (pos > -itemW)           pos -= count * itemW;
    else if (pos < -count * itemW * 2) pos += count * itemW;
  }

  // 4) Animation frame loop
  function loop() {
    track.style.transform = `translateX(${pos}px)`;
    wrap();
    raf = requestAnimationFrame(loop);
  }

  // 5) Pointer drag
  track.addEventListener('pointerdown', e => {
    isDown = true;
    startX = e.clientX;
    startPos = pos;
    cancelAnimationFrame(raf);
  });
  window.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    loop();
  });
  track.addEventListener('pointermove', e => {
    if (!isDown) return;
    pos = startPos + (e.clientX - startX);
    track.style.transform = `translateX(${pos}px)`;
  });

  // 6) Arrow controls
  document.querySelector('.arrow.left').onclick = () => {
    pos += itemW;
    track.style.transition = 'transform .3s';
    track.style.transform = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  };
  document.querySelector('.arrow.right').onclick = () => {
    pos -= itemW;
    track.style.transition = 'transform .3s';
    track.style.transform = `translateX(${pos}px)`;
    setTimeout(() => {
      track.style.transition = '';
      wrap();
    }, 300);
  };

  // 7) Start looping
  loop();
});
