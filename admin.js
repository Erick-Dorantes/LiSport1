// admin.js - Panel admin (español) - MODIFICADO PARA MÚLTIPLES IMÁGENES
// Requiere config.js para APP_SCRIPT_URL, CLOUD_NAME, UPLOAD_PRESET, ADMIN_PASSWORD

const loginBox = document.getElementById('loginBox');
const adminPanel = document.getElementById('adminPanel');
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('loginMsg');
const statusEl = document.getElementById('status');

// Elementos para múltiples imágenes
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('imagenes-file');
const imagesPreview = document.getElementById('images-preview');
const imagenesUrlsInput = document.getElementById('imagenes-urls');
const uploadProgress = document.getElementById('upload-progress');
const uploadCount = document.getElementById('upload-count');
const totalCount = document.getElementById('total-count');
const progressBar = document.getElementById('progress-bar');

// Array para almacenar URLs de imágenes
let imageUrls = [];

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

// ===== FUNCIONALIDAD PARA MÚLTIPLES IMÁGENES =====

// Eventos para subir múltiples imágenes
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-pink-400', 'bg-pink-50', 'dark:bg-pink-900/20');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-pink-400', 'bg-pink-50', 'dark:bg-pink-900/20');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-pink-400', 'bg-pink-50', 'dark:bg-pink-900/20');
    
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

function handleFileSelect() {
    const files = fileInput.files;
    if (files.length === 0) return;
    
    // Validar número de archivos
    if (files.length > 10) {
        showStatus('⚠️ Máximo 10 imágenes permitidas', 'error');
        return;
    }
    
    // Validar tipos de archivo
    const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
        showStatus('❌ Solo se permiten archivos de imagen', 'error');
        return;
    }
    
    uploadImages(files);
}

// Subir múltiples imágenes a Cloudinary
async function uploadImages(files) {
    uploadProgress.classList.remove('hidden');
    totalCount.textContent = files.length;
    uploadCount.textContent = '0';
    progressBar.style.width = '0%';
    
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Actualizar progreso
        uploadCount.textContent = i + 1;
        progressBar.style.width = `${((i + 1) / files.length) * 100}%`;
        
        try {
            const url = await uploadSingleImage(file);
            if (url) {
                uploadedUrls.push(url);
                addImagePreview(url, file.name);
            }
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            showStatus(`❌ Error subiendo imagen ${i + 1}: ${file.name}`, 'error');
        }
    }
    
    // Actualizar array de URLs
    imageUrls = [...imageUrls, ...uploadedUrls];
    imagenesUrlsInput.value = imageUrls.join(',');
    
    // Finalizar
    uploadProgress.classList.add('hidden');
    if (uploadedUrls.length > 0) {
        showStatus(`✅ ${uploadedUrls.length} imagen(es) subida(s) correctamente`, 'success');
    }
    
    // Limpiar input
    fileInput.value = '';
}

// Subir una sola imagen a Cloudinary
async function uploadSingleImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    
    const res = await fetch('https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload', {
        method: 'POST',
        body: fd
    });
    
    const data = await res.json();
    
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error?.message || 'Error al subir');
    }
}

// Agregar vista previa de imagen
function addImagePreview(url, filename = 'Imagen') {
    const preview = document.createElement('div');
    preview.className = 'relative group bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600';
    preview.innerHTML = `
        <img src="${url}" alt="${filename}" class="w-full h-24 object-cover" onerror="this.src='https://via.placeholder.com/150x100?text=Error'">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <button class="remove-image-btn bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110" data-url="${url}">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>
        <div class="p-2 text-xs text-medium-contrast truncate">${filename.substring(0, 15)}...</div>
    `;
    imagesPreview.appendChild(preview);
    
    // Evento para eliminar
    preview.querySelector('.remove-image-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage(url);
        preview.remove();
    });
}

// Eliminar imagen
function removeImage(url) {
    imageUrls = imageUrls.filter(imgUrl => imgUrl !== url);
    imagenesUrlsInput.value = imageUrls.join(',');
    showStatus('🗑️ Imagen eliminada', 'success');
}

// Create / update - MODIFICADO PARA MÚLTIPLES IMÁGENES
document.getElementById('create-btn').addEventListener('click', async ()=>{
  const id = document.getElementById('prod-id').value.trim();
  const payload = {
    id: id || ('p'+Date.now()),
    nombre: document.getElementById('nombre').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    precio: document.getElementById('precio').value.trim(),
    imagenes: imageUrls, // ← Array de URLs de imágenes
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
    if(j.ok){ 
        statusEl.textContent='Operación completada.'; 
        loadList(); 
        clearForm(); 
    }
    else { 
        statusEl.textContent = 'Error: ' + (j.error||JSON.stringify(j)); 
    }
  }catch(err){ 
    console.error(err); 
    statusEl.textContent='Error de conexión'; 
  }
});

async function loadList(){
  try{
    const res = await fetch(APP_SCRIPT_URL + '?action=getProducts');
    const j = await res.json();
    if(!j.ok) return;
    const list = document.getElementById('list'); 
    list.innerHTML='';
    
    j.products.forEach(p => {
      const id = p.ID || p.id || p.Id || '';
      const nombre = p.Nombre || p.nombre || '';
      // Manejar tanto imagen única como múltiples imágenes
      let img = '';
      if (p.Imagen && Array.isArray(p.Imagen) && p.Imagen.length > 0) {
          img = p.Imagen[0]; // Primera imagen del array
      } else if (p.Imagen) {
          img = p.Imagen; // Imagen única (string)
      }
      const precio = p.Precio || p.precio || '';
      const cantidad = p.Cantidad || p.cantidad || '0';
      const categoria = p.Categoría || p.categoria || '';
      
      // Verificar si tiene múltiples imágenes
      const hasMultipleImages = (p.Imagen && Array.isArray(p.Imagen) && p.Imagen.length > 1);
      const imageCount = (p.Imagen && Array.isArray(p.Imagen)) ? p.Imagen.length : 
                        (p.Imagen ? 1 : 0);
      
      const div = document.createElement('div');
      div.className = 'flex items-center gap-3 border-b pb-2';
      div.innerHTML = `
        <div class="relative">
          <img src="${img||'https://via.placeholder.com/80x60?text=No+img'}" class="w-20 h-14 object-cover rounded">
          ${hasMultipleImages ? `<span class="absolute top-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded">+${imageCount-1}</span>` : ''}
        </div>
        <div class="flex-1">
          <div class="font-semibold">${nombre} <span class="text-gray-500 text-sm">(${id})</span></div>
          <div class="text-sm text-gray-600">$${precio} | ${cantidad} disponibles</div>
          <div class="text-xs text-gray-500">${categoria}</div>
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
      document.getElementById('categoria').value = prod.Categoría || prod.categoria || '';
      document.getElementById('cantidad').value = prod.Cantidad || prod.cantidad || '';
      
      // Cargar imágenes (maneja tanto array como string)
      imageUrls = [];
      imagesPreview.innerHTML = '';
      
      if (prod.Imagen && Array.isArray(prod.Imagen)) {
          imageUrls = prod.Imagen;
          prod.Imagen.forEach(url => addImagePreview(url, 'Imagen del producto'));
      } else if (prod.Imagen) {
          imageUrls = [prod.Imagen];
          addImagePreview(prod.Imagen, 'Imagen principal');
      }
      
      imagenesUrlsInput.value = imageUrls.join(',');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (ev)=>{
      const id = ev.target.dataset.id;
      if(!confirm('Eliminar producto ' + id + ' ?')) return;
      try{
        const res = await fetch(APP_SCRIPT_URL + '?action=delete', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ id, token: ADMIN_PASSWORD }) 
        });
        const j2 = await res.json();
        if(j2.ok){ 
            statusEl.textContent='Eliminado.'; 
            loadList(); 
        } else { 
            statusEl.textContent='Error borrando: '+(j2.error||''); 
        }
      }catch(err){ 
        console.error(err); 
        statusEl.textContent='Error de conexión.'; 
      }
    }));

  }catch(err){ 
    console.error(err); 
  }
}

function clearForm(){
  document.getElementById('prod-id').value='';
  document.getElementById('nombre').value='';
  document.getElementById('descripcion').value='';
  document.getElementById('precio').value='';
  document.getElementById('categoria').value='';
  document.getElementById('cantidad').value='';
  
  // Limpiar imágenes
  imagesPreview.innerHTML = '';
  imageUrls = [];
  imagenesUrlsInput.value = '';
  fileInput.value = '';
  uploadProgress.classList.add('hidden');
}

// Función para mostrar estados (mejorada)
function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'mt-4 text-sm text-center p-3 rounded-lg ';
    
    switch(type) {
        case 'success':
            statusEl.className += 'bg-green-100 text-green-800 border border-green-200';
            break;
        case 'error':
            statusEl.className += 'bg-red-100 text-red-800 border border-red-200';
            break;
        case 'loading':
            statusEl.className += 'bg-blue-100 text-blue-800 border border-blue-200';
            break;
        default:
            statusEl.className += 'bg-gray-100 text-gray-800 border border-gray-200';
    }
    
    // Auto-ocultar mensajes de éxito después de 5 segundos
    if (type === 'success') {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'mt-2 text-sm text-gray-600';
            }
        }, 5000);
    }
}

document.getElementById('clear-btn').addEventListener('click', clearForm);

// Inicializar elementos si existen (para compatibilidad)
document.addEventListener('DOMContentLoaded', function() {
    // Reemplazar showStatus si no existe
    if (typeof showStatus === 'undefined') {
        window.showStatus = function(message, type) {
            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.textContent = message;
            }
        };
    }
});