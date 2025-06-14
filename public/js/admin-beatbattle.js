// public/js/admin-beatbattle.js
// Uses global db

document.getElementById('reset-votes').addEventListener('click', async () => {
  const btn = document.getElementById('reset-votes');
  const err = document.getElementById('battle-error');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Resetting...';
  err.textContent = '';
  try {
    const snap = await db.collection('beatBattles/current/tracks').get();
    const batch = db.batch();
    snap.forEach(d => batch.update(db.doc(`beatBattles/current/tracks/${d.id}`), { votes: 0 }));
    await batch.commit();
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});
