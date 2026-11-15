// --- ESTADO DA APLICAÇÃO (DADOS REAIS DA API) ---
let categories = [];
let products = [];
let users = [];
let orders = [];

let currentActiveOrderModal = null;

// --- MÉTODOS DE FORMATAÇÃO PT-BR ---
function formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(isoString) {
    if (!isoString) return '-';

    // Suporte caso venha como array de data/hora do Spring (ex: [2026, 11, 15, 14, 53])
    if (Array.isArray(isoString)) {
        const [year, month, day, hour = 0, minute = 0] = isoString;
        const date = new Date(year, month - 1, day, hour, minute);
        return date.toLocaleDateString('pt-BR') + ' às ' + String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (value.length > 0) {
        value = value.replace(/^(\d{0,2})/, '($1');
    }
    input.value = value;
}

function formatPhoneDisplay(phone) {
    if (!phone) return '-';
    let value = phone.replace(/\D/g, '');
    if (value.length === 11) {
        return value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) {
        return value.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

// --- MÉTODOS AUXILIARES ---
function calculateOrderTotal(order) {
    if (order.total !== undefined && order.total !== null) return order.total;
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
}

function getStatusBadge(status) {
    const badges = {
        WAITING_PAYMENT: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Aguardando Pagamento</span>',
        PAID: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Pago</span>',
        SHIPPED: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">Enviado</span>',
        DELIVERED: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Entregue</span>',
        CANCELED: '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">Cancelado</span>'
    };
    return badges[status] || status;
}

// --- SISTEMA DE TOASTS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const isSuccess = type === 'success';

    toast.className = `toast-enter pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border shadow-xl ${
        isSuccess ? 'bg-slate-900 border-emerald-500/40 text-white' : 'bg-slate-900 border-rose-500/40 text-white'
    }`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="p-1 rounded-lg ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${isSuccess
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
                </svg>
            </div>
            <span class="text-sm font-medium leading-tight">${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function toggleDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('drawerOverlay');
    const isOpen = !sidebar.classList.contains('-translate-x-full');

    if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    } else {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        sidebar.classList.remove('-translate-x-full');
    }
}

// --- CARREGAMENTO GLOBAL DE DADOS DA API ---
async function loadAllData() {
    try {
        const [catRes, prodRes, userRes, orderRes] = await Promise.all([
            fetch('/categories'),
            fetch('/products'),
            fetch('/users'),
            fetch('/orders')
        ]);

        if (catRes.ok) categories = await catRes.json();
        if (prodRes.ok) products = await prodRes.json();
        if (userRes.ok) users = await userRes.json();
        if (orderRes.ok) orders = await orderRes.json();
    } catch (error) {
        console.error("Erro ao comunicar com a API:", error);
        showToast('Erro ao sincronizar dados com o servidor.', 'error');
    }
}

// --- TROCA DE ABAS ---
async function switchTab(tabName, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    const activeSection = document.getElementById(tabName + '-section');
    if (activeSection) activeSection.classList.remove('hidden');

    const pageTitle = document.getElementById('page-title');
    const headerActions = document.getElementById('header-actions');

    await loadAllData();

    if (tabName === 'dashboard') {
        pageTitle.innerText = 'Visão Geral & Métricas';
        headerActions.innerHTML = '';
        loadDashboard();
    } else if (tabName === 'products') {
        pageTitle.innerText = 'Gerenciamento de Produtos';
        headerActions.innerHTML = `
            <button onclick="showProductForm()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                <span>Novo Produto</span>
            </button>`;
        loadProducts();
    } else if (tabName === 'categories') {
        pageTitle.innerText = 'Gerenciamento de Categorias';
        headerActions.innerHTML = `
            <button onclick="showCategoryForm()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                <span>Nova Categoria</span>
            </button>`;
        loadCategories();
    } else if (tabName === 'orders') {
        pageTitle.innerText = 'Gerenciamento de Pedidos';
        headerActions.innerHTML = `
            <button onclick="showOrderForm()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                <span>Novo Pedido</span>
            </button>`;
        loadOrders();
    } else if (tabName === 'users') {
        pageTitle.innerText = 'Clientes Cadastrados';
        headerActions.innerHTML = `
            <button onclick="showUserForm()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                <span>Novo Cliente</span>
            </button>`;
        loadUsers();
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-600/25');
        item.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/60');
    });
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('text-blue-600');
        item.classList.add('text-slate-400');
    });

    if (element) {
        if (element.classList.contains('nav-item')) {
            element.classList.add('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-600/25');
            element.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/60');
        } else if (element.classList.contains('bottom-nav-item')) {
            element.classList.add('text-blue-600');
            element.classList.remove('text-slate-400');
        }
    }

    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('-translate-x-full')) toggleDrawer();
}

// --- LÓGICA DASHBOARD ---
function loadDashboard() {
    const totalRevenue = orders
        .filter(o => o.orderStatus !== 'CANCELED')
        .reduce((sum, o) => sum + calculateOrderTotal(o), 0);

    const pendingCount = orders.filter(o => o.orderStatus === 'WAITING_PAYMENT').length;

    document.getElementById('dash-total-revenue').innerText = formatCurrency(totalRevenue);
    document.getElementById('dash-pending-orders').innerText = pendingCount;
    document.getElementById('dash-total-products').innerText = products.length;
    document.getElementById('dash-total-clients').innerText = users.length;

    const recentOrdersTable = document.getElementById('dash-recent-orders');
    recentOrdersTable.innerHTML = orders.slice(-5).reverse().map(o => `
        <tr class="hover:bg-slate-50">
            <td class="py-3 px-2 font-mono text-xs font-bold text-slate-500">#${o.id}</td>
            <td class="py-3 px-2 font-medium text-slate-800">${o.client ? o.client.name : 'N/A'}</td>
            <td class="py-3 px-2">${getStatusBadge(o.orderStatus)}</td>
            <td class="py-3 px-2 text-right font-semibold text-slate-900">${formatCurrency(calculateOrderTotal(o))}</td>
        </tr>
    `).join('');

    const categoriesSummary = document.getElementById('dash-categories-summary');
    categoriesSummary.innerHTML = categories.map(cat => {
        const count = cat.productsCount !== undefined
            ? cat.productsCount
            : products.filter(p => p.categories && p.categories.some(c => c.id === cat.id)).length;
        const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
        return `
            <div class="space-y-1">
                <div class="flex justify-between text-xs font-semibold">
                    <span class="text-slate-700">${cat.name}</span>
                    <span class="text-slate-400">${count} produtos (${percentage}%)</span>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-600 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// --- LÓGICA DE PRODUTOS ---
function loadProducts() {
    const tbody = document.getElementById('productTableBody');
    const cardsBody = document.getElementById('productCardsBody');

    tbody.innerHTML = products.map(p => {
        const productCats = p.categories ? p.categories.map(c =>
            `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">${c.name}</span>`
        ).join(' ') : '';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-mono text-xs text-slate-500">#${p.id}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <img src="${p.imgUrl}" onerror="this.src='https://placehold.co/100x100?text=Produto'" class="w-10 h-10 rounded-lg object-cover border border-slate-200">
                        <span class="font-semibold text-slate-900">${p.name}</span>
                    </div>
                </td>
                <td class="py-4 px-6 font-semibold text-emerald-600">${formatCurrency(p.price)}</td>
                <td class="py-4 px-6 text-slate-500 max-w-xs truncate">${p.descriptionString || '-'}</td>
                <td class="py-4 px-6">${productCats || '<span class="text-xs text-slate-400">Sem categoria</span>'}</td>
                <td class="py-4 px-6 text-right">
                    <div class="inline-flex items-center gap-1.5">
                        <button onclick="editProduct(${p.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition">Editar</button>
                        <button onclick="deleteProduct(${p.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    cardsBody.innerHTML = products.map(p => `
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div class="flex items-center gap-3">
                <img src="${p.imgUrl}" onerror="this.src='https://placehold.co/100x100?text=Produto'" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0">
                <div class="min-w-0 flex-1">
                    <span class="font-mono text-[10px] text-slate-400">#${p.id}</span>
                    <h4 class="font-bold text-slate-900 text-sm truncate">${p.name}</h4>
                    <span class="text-xs font-bold text-emerald-600">${formatCurrency(p.price)}</span>
                    <p class="text-xs text-slate-500 truncate mt-1">${p.descriptionString || ''}</p>
                </div>
            </div>
            <div class="pt-2 border-t border-slate-100 flex gap-2">
                <button onclick="editProduct(${p.id})" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 text-center">Editar</button>
                <button onclick="deleteProduct(${p.id})" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 text-center">Excluir</button>
            </div>
        </div>
    `).join('');
}

async function showProductForm(pId = null) {
    try {
        const catRes = await fetch('/categories');
        if (catRes.ok) categories = await catRes.json();
    } catch (e) {
        console.error("Erro ao carregar categorias", e);
    }

    const container = document.getElementById('product-form-container');
    const checkboxes = document.getElementById('product-category-checkboxes');

    checkboxes.innerHTML = categories.map(c => `
        <label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input type="checkbox" name="productCats" value="${c.id}" class="rounded text-blue-600 focus:ring-blue-500">
            <span>${c.name}</span>
        </label>
    `).join('');

    if (pId) {
        const p = products.find(prod => prod.id === pId);
        document.getElementById('product-form-title').innerText = 'Editar Produto';
        document.getElementById('productId').value = p.id;
        document.getElementById('productName').value = p.name;
        document.getElementById('productPrice').value = p.price;
        document.getElementById('productImg').value = p.imgUrl || '';
        document.getElementById('productDescription').value = p.descriptionString || '';

        if (p.categories) {
            document.querySelectorAll('input[name="productCats"]').forEach(cb => {
                if (p.categories.some(c => c.id === parseInt(cb.value, 10))) cb.checked = true;
            });
        }
    } else {
        document.getElementById('product-form-title').innerText = 'Cadastrar Novo Produto';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
    }

    container.classList.remove('hidden');
}

function cancelProductForm() {
    document.getElementById('product-form-container').classList.add('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const selectedCategoryIds = Array.from(document.querySelectorAll('input[name="productCats"]:checked'))
        .map(cb => parseInt(cb.value, 10));

    const prodData = {
        name: document.getElementById('productName').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        imgUrl: document.getElementById('productImg').value.trim() || 'https://placehold.co/150x150?text=Produto',
        descriptionString: document.getElementById('productDescription').value.trim(),
        categoryIds: selectedCategoryIds
    };

    try {
        const response = await fetch(id ? `/products/${id}` : '/products', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prodData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao salvar produto');
        }

        showToast(id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        cancelProductForm();
        await loadAllData();
        loadProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao salvar o produto no servidor.', 'error');
    }
}

function editProduct(id) {
    showProductForm(id);
}

async function deleteProduct(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
        const response = await fetch(`/products/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não é permitido deletar o produto pois ele está associado a um ou mais pedidos.');
        }

        showToast('Produto removido com sucesso!');
        await loadAllData();
        loadProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao excluir o produto.', 'error');
    }
}

// --- LÓGICA DE CATEGORIAS ---
function loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    const cardsBody = document.getElementById('categoryCardsBody');

    tbody.innerHTML = categories.map(c => {
        const count = c.productsCount !== undefined
            ? c.productsCount
            : products.filter(p => p.categories && p.categories.some(cat => cat.id === c.id)).length;
        const safeName = c.name.replace(/'/g, "\\'");

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-mono text-xs text-slate-500">#${c.id}</td>
                <td class="py-4 px-6 font-semibold text-slate-900">${c.name}</td>
                <td class="py-4 px-6 font-medium text-slate-600">${count} produtos associados</td>
                <td class="py-4 px-6 text-right">
                    <div class="inline-flex items-center gap-1.5">
                        <button onclick="editCategory(${c.id}, '${safeName}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition">Editar</button>
                        <button onclick="deleteCategory(${c.id}, ${count})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    cardsBody.innerHTML = categories.map(c => {
        const count = c.productsCount !== undefined
            ? c.productsCount
            : products.filter(p => p.categories && p.categories.some(cat => cat.id === c.id)).length;
        const safeName = c.name.replace(/'/g, "\\'");

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="font-mono text-[10px] text-slate-400">#${c.id}</span>
                        <h4 class="font-bold text-slate-900 text-sm">${c.name}</h4>
                        <p class="text-xs text-slate-500">${count} produtos associados</p>
                    </div>
                </div>
                <div class="pt-2 border-t border-slate-100 flex gap-2">
                    <button onclick="editCategory(${c.id}, '${safeName}')" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 text-center">Editar</button>
                    <button onclick="deleteCategory(${c.id}, ${count})" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 text-center">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function showCategoryForm(cId = null, cName = '') {
    const container = document.getElementById('category-form-container');
    if (cId) {
        document.getElementById('category-form-title').innerText = 'Editar Categoria';
        document.getElementById('categoryId').value = cId;
        document.getElementById('categoryName').value = cName;
    } else {
        document.getElementById('category-form-title').innerText = 'Cadastrar Nova Categoria';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
    }
    container.classList.remove('hidden');
}

function cancelCategoryForm() {
    document.getElementById('category-form-container').classList.add('hidden');
}

async function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const catData = { name: document.getElementById('categoryName').value.trim() };

    try {
        const response = await fetch(id ? `/categories/${id}` : '/categories', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(catData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao salvar categoria');
        }

        showToast(id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
        cancelCategoryForm();
        await loadAllData();
        loadCategories();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao salvar a categoria no servidor.', 'error');
    }
}

function editCategory(id, name) {
    showCategoryForm(id, name);
}

async function deleteCategory(id, productsCount = 0) {
    if (productsCount > 0) {
        showToast(`Não é possível excluir: existem ${productsCount} produto(s) associado(s) a esta categoria.`, 'error');
        return;
    }

    if (!confirm('Deseja realmente excluir esta categoria?')) return;

    try {
        const response = await fetch(`/categories/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Não é permitido deletar a categoria pois existem produtos associados.');
        }

        showToast('Categoria removida com sucesso!');
        await loadAllData();
        loadCategories();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao excluir a categoria.', 'error');
    }
}

// --- LÓGICA DE PEDIDOS (INTEGRADA COM ORDER DTO RECORD) ---
function loadOrders() {
    const tbody = document.getElementById('orderTableBody');
    const cardsBody = document.getElementById('orderCardsBody');

    tbody.innerHTML = orders.map(o => `
        <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-4 px-6 font-mono text-xs font-bold text-slate-500">#${o.id}</td>
            <td class="py-4 px-6 text-slate-600 text-xs">${formatDate(o.moment)}</td>
            <td class="py-4 px-6 font-semibold text-slate-900">${o.client ? o.client.name : 'N/A'}</td>
            <td class="py-4 px-6">${getStatusBadge(o.orderStatus)}</td>
            <td class="py-4 px-6 font-bold text-emerald-600">${formatCurrency(calculateOrderTotal(o))}</td>
            <td class="py-4 px-6 text-right">
                <div class="inline-flex items-center gap-1.5">
                    <button onclick="openOrderModal(${o.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition">Detalhes</button>
                    <button onclick="deleteOrder(${o.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition">Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');

    cardsBody.innerHTML = orders.map(o => `
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-slate-400">Pedido #${o.id}</span>
                ${getStatusBadge(o.orderStatus)}
            </div>
            <div>
                <h4 class="font-bold text-slate-900 text-sm">${o.client ? o.client.name : 'N/A'}</h4>
                <p class="text-xs text-slate-400">${formatDate(o.moment)}</p>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span class="font-bold text-emerald-600 text-sm">${formatCurrency(calculateOrderTotal(o))}</span>
                <div class="flex gap-1.5">
                    <button onclick="openOrderModal(${o.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60">Detalhes</button>
                    <button onclick="deleteOrder(${o.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/60">Excluir</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showOrderForm() {
    const clientSelect = document.getElementById('orderClientSelect');
    if (clientSelect) {
        clientSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
    }

    const container = document.getElementById('order-items-inputs-container');
    if (container) {
        container.innerHTML = '';
        addOrderItemRow();
    }

    const formContainer = document.getElementById('order-form-container');
    if (formContainer) formContainer.classList.remove('hidden');
}

function cancelOrderForm() {
    const formContainer = document.getElementById('order-form-container');
    if (formContainer) formContainer.classList.add('hidden');
}

function addOrderItemRow() {
    const container = document.getElementById('order-items-inputs-container');
    if (!container) return;

    const productOptions = products.map(p => `<option value="${p.id}">${p.name} - ${formatCurrency(p.price)}</option>`).join('');

    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200';
    row.innerHTML = `
        <select class="order-product-select flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white">${productOptions}</select>
        <input type="number" min="1" value="1" class="order-product-qty w-20 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-center" placeholder="Qtd">
        <button type="button" onclick="this.parentElement.remove()" class="text-rose-600 hover:text-rose-800 font-bold px-2">✕</button>
    `;
    container.appendChild(row);
}

async function saveOrder(e) {
    e.preventDefault();
    const clientSelect = document.getElementById('orderClientSelect');
    if (!clientSelect) return;

    const clientId = parseInt(clientSelect.value, 10);
    const rows = document.querySelectorAll('#order-items-inputs-container > div');

    const items = Array.from(rows).map(row => ({
        productId: parseInt(row.querySelector('.order-product-select').value, 10),
        quantity: parseInt(row.querySelector('.order-product-qty').value, 10)
    }));

    if (items.length === 0) {
        showToast('Adicione pelo menos um produto ao pedido.', 'error');
        return;
    }

    const orderData = {
        clientId: clientId,
        items: items
    };

    try {
        const response = await fetch('/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Erro ao criar pedido.');
        }

        showToast('Pedido criado com sucesso!');
        cancelOrderForm();
        await loadAllData();
        loadOrders();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao salvar pedido.', 'error');
    }
}

async function deleteOrder(id) {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    try {
        const response = await fetch(`/orders/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir pedido.');

        showToast('Pedido removido com sucesso!');
        await loadAllData();
        loadOrders();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao excluir o pedido.', 'error');
    }
}

function openOrderModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    currentActiveOrderModal = order;

    document.getElementById('modal-order-id').innerText = `Detalhes do Pedido #${order.id}`;
    document.getElementById('modal-order-moment').innerText = `Data: ${formatDate(order.moment)}`;
    document.getElementById('modal-order-client').innerText = order.client ? order.client.name : 'N/A';
    document.getElementById('modal-order-email').innerText = order.client ? order.client.email : '-';
    document.getElementById('modal-order-status-select').value = order.orderStatus;

    const paymentBox = document.getElementById('modal-order-payment');
    if (order.payment) {
        paymentBox.innerHTML = `
            <p><strong>Status:</strong> Confirmado (ID Pagamento: #${order.payment.id})</p>
            <p><strong>Horário:</strong> ${formatDate(order.payment.moment)}</p>
        `;
    } else {
        paymentBox.innerHTML = `<span class="text-amber-600 font-medium">Aguardando Pagamento</span>`;
    }

    const itemsTable = document.getElementById('modal-order-items-table');
    itemsTable.innerHTML = order.items.map(item => {
        const productName = item.product ? item.product.name : (item.productName || 'Produto #' + item.productId);
        const subtotal = item.subTotal !== undefined ? item.subTotal : (item.price * item.quantity);
        return `
            <tr class="hover:bg-slate-50">
                <td class="py-2.5 px-4 font-medium text-slate-800">${productName}</td>
                <td class="py-2.5 px-4 text-center text-slate-500">${formatCurrency(item.price)}</td>
                <td class="py-2.5 px-4 text-center font-bold text-slate-700">${item.quantity}</td>
                <td class="py-2.5 px-4 text-right font-semibold text-slate-900">${formatCurrency(subtotal)}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('modal-order-total').innerText = formatCurrency(calculateOrderTotal(order));
    document.getElementById('order-detail-modal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('order-detail-modal').classList.add('hidden');
    currentActiveOrderModal = null;
}

async function updateOrderStatusFromModal() {
    if (!currentActiveOrderModal) return;
    const selectEl = document.getElementById('modal-order-status-select');
    if (!selectEl) return;

    const newStatus = selectEl.value;

    try {
        const response = await fetch(`/orders/${currentActiveOrderModal.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStatus)
        });

        if (!response.ok) throw new Error('Erro ao atualizar status.');

        showToast(`Status atualizado para ${newStatus} com sucesso!`);
        closeOrderModal();
        await loadAllData();
        loadOrders();
    } catch (error) {
        console.error(error);
        showToast('Erro ao atualizar status do pedido.', 'error');
    }
}

// --- LÓGICA DE USUÁRIOS / CLIENTES ---
function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    const cardsBody = document.getElementById('userCardsBody');

    if (!tbody || !cardsBody) return;

    tbody.innerHTML = users.map(u => {
        const userOrdersCount = orders.filter(o => o.client && o.client.id === u.id).length;
        const safeName = u.name.replace(/'/g, "\\'");
        const safeEmail = u.email.replace(/'/g, "\\'");
        const safePhone = (u.phone || '').replace(/'/g, "\\'");

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-mono text-xs text-slate-500">#${u.id}</td>
                <td class="py-4 px-6 font-semibold text-slate-900">${u.name}</td>
                <td class="py-4 px-6 text-slate-600">${u.email}</td>
                <td class="py-4 px-6 text-slate-500">${formatPhoneDisplay(u.phone)}</td>
                <td class="py-4 px-6 font-bold text-blue-600">${userOrdersCount} pedidos</td>
                <td class="py-4 px-6 text-right">
                    <div class="inline-flex items-center gap-1.5">
                        <button onclick="editUser(${u.id}, '${safeName}', '${safeEmail}', '${safePhone}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition">Editar</button>
                        <button onclick="deleteUser(${u.id}, ${userOrdersCount})" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    cardsBody.innerHTML = users.map(u => {
        const userOrdersCount = orders.filter(o => o.client && o.client.id === u.id).length;
        const safeName = u.name.replace(/'/g, "\\'");
        const safeEmail = u.email.replace(/'/g, "\\'");
        const safePhone = (u.phone || '').replace(/'/g, "\\'");

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                            ${u.name.charAt(0)}
                        </div>
                        <div>
                            <span class="font-mono text-[10px] text-slate-400">#${u.id}</span>
                            <h4 class="font-bold text-slate-900 text-sm">${u.name}</h4>
                            <p class="text-xs text-slate-500">${u.email}</p>
                            <p class="text-xs text-slate-400">${formatPhoneDisplay(u.phone)}</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">${userOrdersCount} pedidos</span>
                </div>
                <div class="pt-2 border-t border-slate-100 flex gap-2">
                    <button onclick="editUser(${u.id}, '${safeName}', '${safeEmail}', '${safePhone}')" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 text-center">Editar</button>
                    <button onclick="deleteUser(${u.id}, ${userOrdersCount})" class="flex-1 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 text-center">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function showUserForm(uId = null, uName = '', uEmail = '', uPhone = '') {
    const container = document.getElementById('user-form-container');
    if (uId) {
        document.getElementById('user-form-title').innerText = 'Editar Cliente';
        document.getElementById('userId').value = uId;
        document.getElementById('userName').value = uName;
        document.getElementById('userEmail').value = uEmail;
        document.getElementById('userPhone').value = formatPhoneDisplay(uPhone) !== '-' ? formatPhoneDisplay(uPhone) : '';
    } else {
        document.getElementById('user-form-title').innerText = 'Cadastrar Novo Cliente';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
    }
    container.classList.remove('hidden');
}

function cancelUserForm() {
    document.getElementById('user-form-container').classList.add('hidden');
}

async function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('userId').value;

    const userData = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim()
    };

    try {
        const response = await fetch(id ? `/users/${id}` : '/users', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao salvar cliente');
        }

        showToast(id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
        cancelUserForm();
        await loadAllData();
        loadUsers();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao salvar o cliente no servidor.', 'error');
    }
}

function editUser(id, name, email, phone) {
    showUserForm(id, name, email, phone);
}

async function deleteUser(id, ordersCount = 0) {
    if (ordersCount > 0) {
        showToast('Não é permitido deletar o cliente pois existem pedidos associados a ele.', 'error');
        return;
    }

    if (!confirm('Deseja realmente excluir este cliente?')) return;

    try {
        const response = await fetch(`/users/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao excluir cliente.');
        }

        showToast('Cliente removido com sucesso!');
        await loadAllData();
        loadUsers();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Erro ao excluir o cliente.', 'error');
    }
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.onload = async function() {
    await loadAllData();
    switchTab('dashboard');
};