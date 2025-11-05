// admin.js - Panel admin (español) - MODIFICADO PARA MÚLTIPLES IMÁGENES Y LOGIN SEGURO
// Requiere config.js para APP_SCRIPT_URL, CLOUD_NAME, UPLOAD_PRESET

// ===== SISTEMA DE AUTENTICACIÓN SEGURA =====
let isAuthenticated = false;

const PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; 

// Elementos del DOM
const loginBox = document.getElementById('loginBox');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('admin-password');
const errorMsg = document.getElementById('error-msg');
const statusEl = document.getElementById('status');
const logoutBtn = document.getElementById('logoutBtn');

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

// Variables globales
let currentProducts = [];
let isEditing = false;
let currentEditId = null;

// ===== FUNCIONALIDAD DE LOGIN SEGURO =====

// Función para verificar contraseña
async function verificarPassword() {
    const inputPassword = passwordInput.value;
    
    if (!inputPassword) {
        errorMsg.textContent = 'Por favor ingresa una contraseña';
        errorMsg.style.display = 'block';
        return;
    }

    // Crear hash SHA-256 del input
    const inputHash = await generarHash(inputPassword);
    
    if (inputHash === PASSWORD_HASH) {
        // Login exitoso
        isAuthenticated = true;
        loginBox.style.display = 'none';
        adminPanel.style.display = 'block';
        
        // Inicializar el panel admin
        inicializarPanelAdmin();
    } else {
        // Login fallido
        errorMsg.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Función para generar hash SHA-256
async function generarHash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Función para cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        isAuthenticated = false;
        adminPanel.style.display = 'none';
        loginBox.style.display = 'flex';
        passwordInput.value = '';
        errorMsg.style.display = 'none';
        clearForm();
        showStatus('Sesión cerrada correctamente', 'success');
    }
}

// Inicializar panel admin después del login
function inicializarPanelAdmin() {
    console.log('Panel admin inicializado');
    loadProductList();
}

// Permitir login con Enter
if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verificarPassword();
        }
    });
}

// Asignar evento al botón de logout si existe
if (logoutBtn) {
    logoutBtn.addEventListener('click', cerrarSesion);
}

// ===== FUNCIONALIDAD PARA MÚLTIPLES IMÁGENES =====

// Eventos para subir múltiples imágenes
if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
}
if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
}

// Drag and drop
if (uploadArea) {
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
}

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
    fd.append('upload_preset', CONFIG.UPLOAD_PRESET);
    
    const res = await fetch('https://api.cloudinary.com/v1_1/' + CONFIG.CLOUD_NAME + '/image/upload', {
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
    preview.className = 'image-preview';
    preview.innerHTML = `
        <img src="${url}" alt="${filename}" class="w-full h-24 object-cover" onerror="this.src='https://via.placeholder.com/150x100?text=Error'">
        <button class="remove-image-btn" data-url="${url}">
            <i class="fas fa-times"></i>
        </button>
        <div class="p-2 text-xs text-medium-contrast truncate bg-white dark:bg-gray-800">${filename.substring(0, 15)}...</div>
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

// ===== FUNCIONALIDAD DE PRODUCTOS =====

// Generar ID único
function generateProductId() {
    return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create / update - MODIFICADO PARA MÚLTIPLES IMÁGENES
document.getElementById('create-btn').addEventListener('click', async ()=>{
    if (!isAuthenticated) {
        showStatus('❌ Debes iniciar sesión primero', 'error');
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precio = document.getElementById('precio').value.trim();
    const cantidad = document.getElementById('cantidad').value.trim();
    const categoria = document.getElementById('categoria').value;
    
    // Validaciones
    if (!nombre) {
        showStatus('⚠️ El nombre del producto es obligatorio', 'error');
        return;
    }
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
        showStatus('⚠️ El precio debe ser un número válido mayor o igual a 0', 'error');
        return;
    }
    if (!cantidad || isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0) {
        showStatus('⚠️ La cantidad debe ser un número válido mayor o igual a 0', 'error');
        return;
    }
    if (!categoria) {
        showStatus('⚠️ Selecciona una categoría', 'error');
        return;
    }
    
    const id = isEditing ? currentEditId : generateProductId();
    const payload = {
        id: id,
        nombre: nombre,
        descripcion: descripcion,
        precio: parseFloat(precio).toFixed(2),
        cantidad: parseInt(cantidad),
        imagenes: imageUrls, // ← Array de URLs de imágenes
        categoria: categoria,
        token: PASSWORD_HASH // Usamos el hash como token
    };
    
    const action = isEditing ? 'update' : 'create';
    showStatus(isEditing ? '⏳ Actualizando producto...' : '⏳ Creando producto...', 'loading');
    
    try{
        const res = await fetch(CONFIG.APP_SCRIPT_URL + '?action=' + action, {
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if(data.ok){ 
            showStatus('✅ ' + (isEditing ? 'Producto actualizado' : 'Producto creado') + ' correctamente', 'success');
            loadProductList(); 
            clearForm(); 
        } else { 
            showStatus('❌ Error: ' + (data.error||'Error desconocido'), 'error'); 
        }
    } catch(err){ 
        console.error(err); 
        showStatus('❌ Error de conexión', 'error'); 
    }
});

// Cargar lista de productos
async function loadProductList(){
    if (!isAuthenticated) return;
    
    try{
        const res = await fetch(CONFIG.APP_SCRIPT_URL + '?action=getProducts');
        const data = await res.json();
        if(!data.ok) return;
        
        currentProducts = data.products || [];
        const list = document.getElementById('list'); 
        list.innerHTML='';
        
        if (currentProducts.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-medium-contrast">
                    <i class="fas fa-box-open text-4xl mb-3"></i>
                    <p class="text-lg">No hay productos registrados</p>
                    <p class="text-sm">Usa el formulario superior para agregar el primer producto</p>
                </div>
            `;
            return;
        }
        
        currentProducts.forEach(p => {
            const id = p.ID || p.id || '';
            const nombre = p.Nombre || p.nombre || '';
            const descripcion = p.Descripción || p.descripcion || '';
            const precio = p.Precio || p.precio || '';
            const cantidad = p.Cantidad || p.cantidad || '0';
            const categoria = p.Categoría || p.categoria || '';
            
            // Manejar tanto imagen única como múltiples imágenes
            let img = '';
            if (p.Imagen && Array.isArray(p.Imagen) && p.Imagen.length > 0) {
                img = p.Imagen[0]; // Primera imagen del array
            } else if (p.Imagen) {
                img = p.Imagen; // Imagen única (string)
            }
            
            // Verificar si tiene múltiples imágenes
            const hasMultipleImages = (p.Imagen && Array.isArray(p.Imagen) && p.Imagen.length > 1);
            const imageCount = (p.Imagen && Array.isArray(p.Imagen)) ? p.Imagen.length : 
                            (p.Imagen ? 1 : 0);
            
            const div = document.createElement('div');
            div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 product-card';
            div.innerHTML = `
                <div class="flex flex-col md:flex-row md:items-center gap-4">
                    <div class="flex-shrink-0 relative">
                        <img src="${img||'https://via.placeholder.com/100x75?text=Sin+img'}" 
                             alt="${nombre}" 
                             class="w-20 h-20 object-cover rounded-lg"
                             onerror="this.src='https://via.placeholder.com/100x75?text=Error'">
                        ${hasMultipleImages ? `<span class="image-count-badge">+${imageCount-1}</span>` : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                                <h3 class="font-semibold text-high-contrast truncate">${nombre}</h3>
                                <p class="text-sm text-medium-contrast mt-1 line-clamp-2">${descripcion}</p>
                                <div class="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                    <span class="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-2 py-1 rounded-full text-xs font-medium">
                                        ${categoria}
                                    </span>
                                    <span class="font-bold text-green-600 dark:text-green-400">$${precio}</span>
                                    <span class="font-medium ${cantidad > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                        ${cantidad} disponibles
                                    </span>
                                    <span class="text-medium-contrast">ID: ${id}</span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="edit-btn bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                                        data-id="${id}">
                                    <i class="fas fa-edit mr-1"></i>Editar
                                </button>
                                <button class="del-btn bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                                        data-id="${id}">
                                    <i class="fas fa-trash mr-1"></i>Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });

        // Event listeners para botones de editar
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (ev)=>{
            if (!isAuthenticated) return;
            const id = ev.target.dataset.id;
            editProduct(id);
        }));

        // Event listeners para botones de eliminar
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', (ev)=>{
            if (!isAuthenticated) return;
            const id = ev.target.dataset.id;
            deleteProduct(id);
        }));

    } catch(err){ 
        console.error(err); 
        showStatus('❌ Error cargando productos', 'error');
    }
}

// Editar producto
function editProduct(id) {
    const product = currentProducts.find(p => (p.ID === id) || (p.id === id));
    
    if (!product) {
        showStatus('❌ Producto no encontrado', 'error');
        return;
    }
    
    // Llenar formulario con datos del producto
    document.getElementById('prod-id').value = product.ID || product.id || '';
    document.getElementById('nombre').value = product.Nombre || product.nombre || '';
    document.getElementById('descripcion').value = product.Descripción || product.descripcion || '';
    document.getElementById('precio').value = product.Precio || product.precio || '';
    document.getElementById('cantidad').value = product.Cantidad || product.cantidad || '';
    document.getElementById('categoria').value = product.Categoría || product.categoria || '';
    
    // Cargar imágenes (maneja tanto array como string)
    imageUrls = [];
    imagesPreview.innerHTML = '';
    
    if (product.Imagen && Array.isArray(product.Imagen)) {
        imageUrls = product.Imagen;
        product.Imagen.forEach(url => addImagePreview(url, 'Imagen del producto'));
    } else if (product.Imagen) {
        imageUrls = [product.Imagen];
        addImagePreview(product.Imagen, 'Imagen principal');
    }
    
    imagenesUrlsInput.value = imageUrls.join(',');
    
    isEditing = true;
    currentEditId = product.ID || product.id;
    
    showStatus('📝 Editando producto: ' + (product.Nombre || product.nombre), 'success');
    
    // Scroll al formulario
    document.getElementById('prod-id').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

// Eliminar producto
async function deleteProduct(id) {
    const product = currentProducts.find(p => (p.ID === id) || (p.id === id));
    
    if (!product) {
        showStatus('❌ Producto no encontrado', 'error');
        return;
    }
    
    const productName = product.Nombre || product.nombre || 'este producto';
    
    if (!confirm(`¿Estás seguro de que quieres eliminar "${productName}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    showStatus('⏳ Eliminando producto...', 'loading');
    
    try{
        const res = await fetch(CONFIG.APP_SCRIPT_URL + '?action=delete', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ id, token: PASSWORD_HASH }) 
        });
        const data = await res.json();
        if(data.ok){ 
            showStatus('✅ Producto eliminado correctamente', 'success');
            loadProductList(); 
            if (isEditing && currentEditId === id) {
                clearForm();
            }
        } else { 
            showStatus('❌ Error eliminando: ' + (data.error||''), 'error'); 
        }
    } catch(err){ 
        console.error(err); 
        showStatus('❌ Error de conexión', 'error'); 
    }
}

// Limpiar formulario
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
    if (fileInput) fileInput.value = '';
    uploadProgress.classList.add('hidden');
    
    isEditing = false;
    currentEditId = null;
    
    showStatus('Formulario listo para nuevo producto', 'success');
}

// Función para mostrar estados
function showStatus(message, type) {
    if (!statusEl) return;
    
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

// Event listeners
document.getElementById('clear-btn').addEventListener('click', clearForm);
document.getElementById('refresh-btn').addEventListener('click', loadProductList);

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado (para desarrollo)
    const sessionTime = localStorage.getItem('lisport_admin_session');
    if (sessionTime) {
        const sessionAge = Date.now() - parseInt(sessionTime);
        // Sesión expira después de 8 horas
        if (sessionAge < 8 * 60 * 60 * 1000) {
            isAuthenticated = true;
            if (loginBox) loginBox.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            inicializarPanelAdmin();
        } else {
            localStorage.removeItem('lisport_admin_session');
        }
    }
});