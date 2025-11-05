// admin.js - Panel admin (español)
// Requiere config.js para APP_SCRIPT_URL, CLOUD_NAME, UPLOAD_PRESET, ADMIN_PASSWORD

const loginBox = document.getElementById('loginBox');
const adminPanel = document.getElementById('adminPanel');
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('loginMsg');
const statusEl = document.getElementById('status');

loginBtn.addEventListener('click', ()=>{
  const pw = passwordInput.value;
  if(pw === ADMIN_PASSWORD){
    loginBox.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadList();
  } else {
    loginMsg.textContent = 'Contraseña incorrecta';
  }
});

// Upload to Cloudinary (unsigned)
document.getElementById('upload-btn').addEventListener('click', async ()=>{
  const file = document.getElementById('imagen-file').files[0];
  if(!file) return alert('Selecciona un archivo primero');
  statusEl.textContent = 'Subiendo imagen a Cloudinary...';
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  try{
    const res = await fetch('https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if(j.secure_url){
      document.getElementById('imagen-url').value = j.secure_url;
      statusEl.textContent = 'Imagen subida correctamente.';
    } else {
      console.error(j);
      statusEl.textContent = 'Error subiendo imagen.';
    }
  }catch(err){ console.error(err); statusEl.textContent='Error de conexión.'; }
});

// Create / update
document.getElementById('create-btn').addEventListener('click', async ()=>{
  const id = document.getElementById('prod-id').value.trim();
  const payload = {
    id: id || ('p'+Date.now()),
    nombre: document.getElementById('nombre').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    precio: document.getElementById('precio').value.trim(),
    imagen: document.getElementById('imagen-url').value.trim(),
    categoria: document.getElementById('categoria').value.trim(),
    cantidad: document.getElementById('cantidad').value.trim(),
    token: ADMIN_PASSWORD
  };
  const action = id ? 'update' : 'create';
  statusEl.textContent = (id ? 'Actualizando...' : 'Creando...');
  try{
    const res = await fetch(APP_SCRIPT_URL + '?action=' + action, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const j = await res.json();
    if(j.ok){ statusEl.textContent='Operación completada.'; loadList(); clearForm(); }
    else { statusEl.textContent = 'Error: ' + (j.error||JSON.stringify(j)); }
  }catch(err){ console.error(err); statusEl.textContent='Error de conexión'; }
});

async function loadList(){
  try{
    const res = await fetch(APP_SCRIPT_URL + '?action=getProducts');
    const j = await res.json();
    if(!j.ok) return;
    const list = document.getElementById('list'); list.innerHTML='';
    j.products.forEach(p => {
      const id = p.ID || p.id || p.Id || '';
      const nombre = p.Nombre || p.nombre || '';
      const img = p.Imagen || p.imagen || '';
      const precio = p.Precio || p.precio || '';
      const div = document.createElement('div');
      div.className = 'flex items-center gap-3 border-b pb-2';
      div.innerHTML = `
        <img src="${img||'https://via.placeholder.com/80x60?text=No+img'}" class="w-20 h-14 object-cover rounded">
        <div class="flex-1">
          <div class="font-semibold">${nombre} <span class="text-gray-500 text-sm">(${id})</span></div>
          <div class="text-sm text-gray-600">$${precio}</div>
        </div>
        <div class="flex gap-2">
          <button class="edit-btn bg-yellow-400 px-3 py-1 rounded" data-id="${id}">Editar</button>
          <button class="del-btn bg-red-500 text-white px-3 py-1 rounded" data-id="${id}">Eliminar</button>
        </div>
      `;
      list.appendChild(div);
    });

    document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', async (ev)=>{
      const id = ev.target.dataset.id;
      const prod = j.products.find(x => (x.ID==id || x.id==id || x.Id==id));
      if(!prod) return alert('Producto no encontrado');
      document.getElementById('prod-id').value = prod.ID || prod.id || '';
      document.getElementById('nombre').value = prod.Nombre || prod.nombre || '';
      document.getElementById('descripcion').value = prod.Descripción || prod.descripcion || '';
      document.getElementById('precio').value = prod.Precio || prod.precio || '';
      document.getElementById('imagen-url').value = prod.Imagen || prod.imagen || '';
      document.getElementById('categoria').value = prod.Categoría || prod.categoria || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (ev)=>{
      const id = ev.target.dataset.id;
      if(!confirm('Eliminar producto ' + id + ' ?')) return;
      try{
        const res = await fetch(APP_SCRIPT_URL + '?action=delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, token: ADMIN_PASSWORD }) });
        const j2 = await res.json();
        if(j2.ok){ statusEl.textContent='Eliminado.'; loadList(); } else { statusEl.textContent='Error borrando: '+(j2.error||''); }
      }catch(err){ console.error(err); statusEl.textContent='Error de conexión.'; }
    }));

  }catch(err){ console.error(err); }
}

function clearForm(){
  document.getElementById('prod-id').value='';
  document.getElementById('nombre').value='';
  document.getElementById('descripcion').value='';
  document.getElementById('precio').value='';
  document.getElementById('imagen-url').value='';
  document.getElementById('categoria').value='';
}

document.getElementById('clear-btn').addEventListener('click', clearForm);
