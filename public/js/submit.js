document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/submissions'); const data = await res.json();
  const tbody = document.querySelector('.queue-table tbody');
  tbody.innerHTML = data.map((item,i) => 
    `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.originalName}</td><td>${item.type}</td></tr>`
  ).join('');
});