// public/js/beatbattle.js
// Uses global db

async function renderBattle() {
  const container = document.getElementById("battle-container");
  container.innerHTML = '';                   // clear old items

  // 1) Query only battle‐tagged submissions
  const snap = await db
    .collection('submissions')
    .where('type', '==', 'battle')
    .orderBy('createdAt', 'asc')              // or desc if you prefer
    .get();

  snap.forEach(docSnap => {
    const { name, url, votes = 0 } = docSnap.data();
    const card = document.createElement('div');
    card.classList.add('track');

    card.innerHTML = `
      <p><strong>${name}</strong></p>
      <audio controls src="${url}"></audio>
      <button id="vote-${docSnap.id}">Vote (${votes})</button>
    `;
    container.appendChild(card);

    // 2) Attach vote handler
    document.getElementById(`vote-${docSnap.id}`)
      .addEventListener('click', async () => {
        try {
          await db.doc(`submissions/${docSnap.id}`)
            .update({ votes: firebase.firestore.FieldValue.increment(1) });
          renderBattle();                        // re‐draw updated counts
        } catch (e) {
          console.error("Vote error:", e);
        }
      });
  });
}

renderBattle();
