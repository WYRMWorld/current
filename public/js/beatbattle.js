async function renderBattle() {
  const snap = await db.collection("beatBattles/current/tracks").get();
  const cont = document.getElementById("battle-container");
  snap.forEach(d => {
    const { name, url, votes=0 } = d.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${name}</p>
      <audio controls src="${url}"></audio>
      <button onclick="vote('${d.id}')">Vote (${votes})</button>
    `;
    cont.appendChild(div);
  });
}
window.vote = async id => {
  const ref = db.doc(`beatBattles/current/tracks/${id}`);
  await ref.update({ votes: firebase.firestore.FieldValue.increment(1) });
  location.reload();
};
renderBattle();

