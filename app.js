// app.js - Catálogo público (español) - Versión Mejorada
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcYnsQR4R--fF6ggRPBcbwsIWFPAlzkX9Lwt7LlJ6LbAMpfTYy72XOM3jPw5t8sfU/exec';

let productos = [];

async function loadProducts(){
  try{
    const res = await fetch(APP_SCRIPT_URL + '?action=getProducts&timestamp=' + Date.now());
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    const j = await res.json();
    if(!j.ok) { 
      console.error('Error al cargar productos', j); 
      showError('Error al cargar productos');
      return; 
    }
    productos = j.products;
    populateCategorias();
    render(productos);
  }catch(err){ 
    console.error(err); 
    showError('Error de conexión al cargar productos');
  }
}

function populateCategorias(){
  const select = document.getElementById('categoria');
  // Limpiar opciones existentes excepto "Todas"
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }
  
  const cats = [...new Set(productos.map(p => (p.Categoría||p.categoria||p.Category||'General')).filter(Boolean))];
  cats.sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    // Formatear nombre de categoría (primera letra mayúscula)
    const formattedCat = c.charAt(0).toUpperCase() + c.slice(1);
    opt.textContent = formattedCat;
    select.appendChild(opt);
  });
}

function render(list){
  const cont = document.getElementById('catalogo');
  
  if (list.length === 0) {
    cont.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No se encontraron productos</h3>
        <p class="text-gray-500 dark:text-gray-400">Intenta con otros términos de búsqueda o categoría</p>
      </div>
    `;
    return;
  }
  
  cont.innerHTML = '';
  list.forEach(p => {
    const nombre = p.Nombre || p.nombre || 'Sin nombre';
    const descripcion = p.Descripción || p.descripcion || 'Sin descripción';
    const precio = p.Precio || p.precio || '0';
    const categoria = p.Categoría || p.categoria || p.Category || 'General';
    const cantidad = p.Cantidad || p.cantidad || 0;
    
    // Manejar múltiples imágenes - tomar la primera como principal
    let imagen = '';
    if (p.Imagen && Array.isArray(p.Imagen) && p.Imagen.length > 0) {
      imagen = p.Imagen[0];
    } else if (p.Imagen) {
      imagen = p.Imagen;
    }
    
    const card = document.createElement('div');
    card.className = 'producto bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group';
    card.innerHTML = `
      <div class="relative overflow-hidden">
        <img src="${imagen}" alt="${nombre}" 
             class="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
             onerror="this.src='https://via.placeholder.com/400x300/ff4c7a/ffffff?text=LiSport'">
        ${cantidad === 0 ? `
          <div class="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            Agotado
          </div>
        ` : ''}
        <div class="absolute top-3 left-3 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}
        </div>
      </div>
      <div class="p-4 flex flex-col flex-1">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">${nombre}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm flex-1 mb-3 line-clamp-3">${descripcion}</p>
        <div class="flex items-center justify-between mt-auto">
          <p class="text-rose-500 font-bold text-xl">$${parseFloat(precio).toFixed(2)}</p>
          ${cantidad > 0 ? `
            <span class="text-green-600 dark:text-green-400 text-sm font-medium">
              ${cantidad} disponibles
            </span>
          ` : `
            <span class="text-red-500 text-sm font-medium">
              Sin stock
            </span>
          `}
        </div>
      </div>
    `;
    cont.appendChild(card);
  });
}

// Filtros mejorados
document.getElementById('buscar').addEventListener('input', filtrar);
document.getElementById('categoria').addEventListener('change', filtrar);

function filtrar(){
  const q = document.getElementById('buscar').value.toLowerCase().trim();
  const cat = document.getElementById('categoria').value;
  
  const filtered = productos.filter(p => {
    const nombre = (p.Nombre||p.nombre||'').toLowerCase();
    const descripcion = (p.Descripción||p.descripcion||'').toLowerCase();
    const categoria = (p.Categoría||p.categoria||p.Category||'');
    
    const matchName = nombre.includes(q) || descripcion.includes(q);
    const matchCat = (cat === 'all') || (categoria === cat);
    
    return matchName && matchCat;
  });
  
  // Mostrar contador de resultados
  updateResultsCount(filtered.length);
  render(filtered);
}

function updateResultsCount(count) {
  let counter = document.getElementById('results-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'results-counter';
    counter.className = 'col-span-full text-center text-gray-600 dark:text-gray-400 mb-4';
    document.getElementById('catalogo').parentNode.insertBefore(counter, document.getElementById('catalogo'));
  }
  
  if (count === productos.length) {
    counter.textContent = `Mostrando todos los ${count} productos`;
  } else {
    counter.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }
}

function showError(message) {
  const cont = document.getElementById('catalogo');
  cont.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Error</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">${message}</p>
      <button onclick="loadProducts()" class="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">
        <i class="fas fa-sync-alt mr-2"></i>Reintentar
      </button>
    </div>
  `;
}

// Dark mode toggle mejorado
const body = document.getElementById('body');
const darkToggle = document.getElementById('darkToggle');
const darkIcon = document.getElementById('darkIcon');

function setDark(isDark) {
  if (isDark) {
    body.classList.add('dark');
    darkIcon.textContent = '☀️';
    darkIcon.title = 'Modo claro';
    localStorage.setItem('lisport_dark', '1');
  } else {
    body.classList.remove('dark');
    darkIcon.textContent = '🌙';
    darkIcon.title = 'Modo oscuro';
    localStorage.removeItem('lisport_dark');
  }
}

if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    setDark(!body.classList.contains('dark'));
  });
}

// Inicializar modo oscuro desde localStorage o preferencias del sistema
if (localStorage.getItem('lisport_dark') === '1' || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('lisport_dark'))) {
  setDark(true);
}

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  
  // Agregar estilos CSS para line-clamp
  const style = document.createElement('style');
  style.textContent = `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
});

// Recargar productos cada 2 minutos (opcional)
setInterval(() => {
  if (document.visibilityState === 'visible') {
    loadProducts();
  }
}, 120000);
