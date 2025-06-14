document.addEventListener('DOMContentLoaded', async () => {
  let { feedback, battle } = await fetchQueues();
  const archive = [];

  const fbBody = document.getElementById('feedback-body');
  const btBody = document.getElementById('battle-body');
  const archList = document.getElementById('archive-list');

  document.getElementById('next-feedback')
    .addEventListener('click', () => {
      if (!feedback.length) return;
      archive.push(feedback.shift());
      render();
    });

  document.getElementById('next-battle')
    .addEventListener('click', () => {
      if (!battle.length) return;
      archive.push(battle.shift());
      render();
    });

  function render() {
    fbBody.innerHTML = feedback.map((item,i) =>
      `<tr>
         <td>${i+1}</td>
         <td>${item.name}</td>
         <td>${item.originalName}</td>
         <td><audio controls src="/uploads/${item.storedName}"></audio></td>
       </tr>`
    ).join('');
    btBody.innerHTML = battle.map((item,i) =>
      `<tr>
         <td>${i+1}</td>
         <td>${item.name}</td>
         <td>${item.originalName}</td>
         <td><audio controls src="/uploads/${item.storedName}"></audio></td>
       </tr>`
    ).join('');
    archList.innerHTML = archive.map((item,i)=> 
      `<li>${i+1}. ${item.name} (${item.type}) — ${item.originalName}</li>`
    ).join('');
  }

  async function fetchQueues() {
    const res = await fetch('/submissions');
    const data = await res.json();
    return {
      feedback: data.filter(x=>x.type==='feedback'),
      battle:   data.filter(x=>x.type==='battle')
    };
  }

  render();
});
