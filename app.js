// app.js - Catálogo público (español)
let productos = [];

async function loadProducts(){
  try{
    const res = await fetch(APP_SCRIPT_URL + '?action=getProducts');
    const j = await res.json();
    if(!j.ok) { console.error('Error al cargar productos', j); return; }
    productos = j.products;
    populateCategorias();
    render(productos);
  }catch(err){ console.error(err); }
}

function populateCategorias(){
  const select = document.getElementById('categoria');
  const cats = [...new Set(productos.map(p => (p.Categoría||p.categoria||p.Category||'')).filter(Boolean))];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function render(list){
  const cont = document.getElementById('catalogo');
  cont.innerHTML = '';
  list.forEach(p => {
    const nombre = p.Nombre || p.nombre || '';
    const descripcion = p.Descripción || p.descripcion || '';
    const precio = p.Precio || p.precio || '';
    const imagen = p.Imagen || p.imagen || p.Image || '';
    const card = document.createElement('div');
    card.className = 'producto bg-white rounded-lg shadow p-4 flex flex-col';
    card.innerHTML = `
      <img src="${imagen}" alt="${nombre}" class="w-full h-48 object-cover rounded-md mb-4" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+imagen'">
      <h3 class="text-lg font-semibold mb-2">${nombre}</h3>
      <p class="text-gray-600 flex-1 mb-2">${descripcion}</p>
      <p class="text-rose-500 font-bold text-lg">$${precio}</p>
    `;
    cont.appendChild(card);
  });
}

// Filtros
document.getElementById('buscar').addEventListener('input', filtrar);
document.getElementById('categoria').addEventListener('change', filtrar);

function filtrar(){
  const q = document.getElementById('buscar').value.toLowerCase();
  const cat = document.getElementById('categoria').value;
  const filtered = productos.filter(p => {
    const nombre = (p.Nombre||p.nombre||'').toLowerCase();
    const categoria = (p.Categoría||p.categoria||p.Category||'');
    const matchName = nombre.includes(q);
    const matchCat = (cat === 'all') || (categoria === cat);
    return matchName && matchCat;
  });
  render(filtered);
}

// Dark mode toggle
const body = document.getElementById('body');
const darkToggle = document.getElementById('darkToggle');
const darkIcon = document.getElementById('darkIcon');
function setDark(d){ if(d){ body.classList.add('dark'); darkIcon.textContent='☀️'; localStorage.setItem('lisport_dark','1'); } else { body.classList.remove('dark'); darkIcon.textContent='🌙'; localStorage.removeItem('lisport_dark'); } }
darkToggle.addEventListener('click', ()=>{ setDark(!body.classList.contains('dark')); });
// init dark from localStorage or prefers-color-scheme
if(localStorage.getItem('lisport_dark')==='1' || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) setDark(true);

loadProducts();
