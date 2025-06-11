document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/submissions'); const data = await res.json();
  const tbody = document.getElementById('admin-body');
  tbody.innerHTML = data.map((item,i) => 
    `<tr><td>${i+1}</td><td>${item.name}</td>
     <td>${item.originalName}<br><audio controls src="/uploads/${item.storedName}"></audio></td>
     <td>${item.type}</td></tr>`
  ).join('');
});