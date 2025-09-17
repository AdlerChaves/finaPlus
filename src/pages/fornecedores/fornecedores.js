const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../componentes/auth.js";
import { renderTopbar } from "../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));
let supplierIdToDelete = null;
let allSuppliers = [];

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
    loadSuppliers();
    setupEventListeners();
});



function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');

    // Filtros
    searchInput.addEventListener('keyup', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    // Botões de navegação
    document.getElementById('add-supplier-btn').addEventListener('click', () => {
        window.location.href = '../cadastros/fornecedores/cadastroFornecedores.html';
    });
    document.getElementById('fab-add-supplier').addEventListener('click', () => {
        window.location.href = '../cadastros/fornecedores/cadastroFornecedores.html';
    });

    // Modal de exclusão
    document.getElementById('confirm-delete').addEventListener('click', deleteSupplier);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);

    // Toast
    document.getElementById('close-toast').addEventListener('click', () => {
        document.getElementById('toast').classList.add('hidden');
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusValue = document.getElementById('status-filter').value.toLowerCase();
    const categoryValue = document.getElementById('category-filter').value;

    let filteredSuppliers = allSuppliers;

    // Filtro de busca
    if (searchTerm) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm) ||
            supplier.document.toLowerCase().includes(searchTerm)
        );
    }

    // Filtro por status
    if (statusValue !== 'todos' && statusValue !== 'all') {
        const internalStatus = statusValue === 'ativo' ? 'active' : 'inactive';
        filteredSuppliers = filteredSuppliers.filter(supplier => supplier.status === internalStatus);
    }

    // Filtro por categoria
    if (categoryValue !== 'Todas' && categoryValue !== 'all') {
        filteredSuppliers = filteredSuppliers.filter(supplier => supplier.category === categoryValue);
    }

    renderSupplierList(filteredSuppliers);
}

async function loadSuppliers() {

    try {
        const response = await fetch(`${apiUrl}/api/cadastros/suppliers/`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            window.location.href = '../login.html';
            return;
        }
        if (!response.ok) throw new Error('Falha ao carregar fornecedores.');

        const suppliers = await response.json();
        allSuppliers = suppliers;
        renderSupplierList(suppliers);

    } catch (error) {
        showToast('Erro!', error.message, 'error');
    }
}

function renderSupplierList(suppliers) {
    const tableBody = document.querySelector('table tbody');
    const mobileContainer = document.querySelector('.md\\:hidden.divide-y');

    tableBody.innerHTML = '';
    mobileContainer.innerHTML = '';

    // Resumo
    document.getElementById('summary-total').textContent = suppliers.length;
    document.getElementById('summary-active').textContent = suppliers.filter(s => s.status === 'active').length;
    document.getElementById('summary-inactive').textContent = suppliers.filter(s => s.status === 'inactive').length;

    if (suppliers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum fornecedor cadastrado.</td></tr>';
        mobileContainer.innerHTML = '<p class="text-center py-4 text-gray-500">Nenhum fornecedor cadastrado.</p>';
        return;
    }

    suppliers.forEach(supplier => {
        const initials = (supplier.name.split(' ').map(n => n[0]).join('') || 'F').substring(0, 2).toUpperCase();
        const statusClass = supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const statusText = supplier.status === 'active' ? 'Ativo' : 'Inativo';

        const actionButtons = `
                <button onclick="editSupplier(${supplier.id})" class="text-primary hover:text-blue-700 mr-3"><i class="fas fa-edit"></i></button>
                <button onclick="confirmDelete(${supplier.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash"></i></button>
            `;

        const rowHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">${initials}</div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${supplier.name}</div>
                            <div class="text-sm text-gray-500">${supplier.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.document}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.category || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionButtons}</td>
            `;
        tableBody.innerHTML += `<tr>${rowHTML}</tr>`;

        const cardHTML = `
                <div class="p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">${initials}</div>
                        <div class="ml-4 flex-1">
                            <div class="flex justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${supplier.name}</p>
                                    <p class="text-xs text-gray-500">${supplier.document}</p>
                                </div>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span>
                            </div>
                            <div class="mt-2">
                                <p class="text-xs text-gray-500"><i class="fas fa-phone mr-1"></i> ${supplier.phone}</p>
                                <p class="text-xs text-gray-500"><i class="fas fa-envelope mr-1"></i> ${supplier.email}</p>
                                <p class="text-xs text-gray-500"><i class="fas fa-tag mr-1"></i> ${supplier.category || 'N/A'}</p>
                            </div>
                            <div class="mt-2 flex justify-end space-x-3">
                                <button onclick="editSupplier(${supplier.id})" class="text-primary hover:text-blue-700"><i class="fas fa-edit"></i> Editar</button>
                                <button onclick="confirmDelete(${supplier.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash"></i> Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        mobileContainer.innerHTML += cardHTML;
    });
}

function editSupplier(id) {
    window.location.href = `cadastroFornecedores.html?id=${id}`;
}

function confirmDelete(id) {
    supplierIdToDelete = id;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    supplierIdToDelete = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

async function deleteSupplier() {
    if (!supplierIdToDelete) return;


    try {
        const response = await fetch(`${apiUrl}/api/cadastros/suppliers/${supplierIdToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.status !== 204) throw new Error('Falha ao excluir fornecedor.');

        showToast('Sucesso!', 'Fornecedor excluído com sucesso.', 'success');
        loadSuppliers();
    } catch (error) {
        showToast('Erro!', error.message, 'error');
    } finally {
        closeDeleteModal();
    }
}

function showToast(title, message, type) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    if (type === 'success') {
        toastIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
    } else if (type === 'error') {
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
    }

    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 5000);
}