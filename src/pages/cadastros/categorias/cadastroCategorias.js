const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros')
    renderTopbar('cadastros', userData.permissions_list);
    fetchAndRenderCategories();
});
// --- DOM ELEMENTS ---
const formSection = document.getElementById('form-section');
const categoryForm = document.getElementById('category-form');
const categoryIdInput = document.getElementById('category-id');
const categoryNameInput = document.getElementById('category-name');
const categoryTypeSelect = document.getElementById('category-type');
const categoryDreSelect = document.getElementById('category-dre');
const categoryDfcSelect = document.getElementById('category-dfc');
const submitBtnText = document.getElementById('submit-btn-text');
const formTitle = document.getElementById('form-title');
const newCategoryBtn = document.getElementById('new-category-btn');
const emptyStateBtn = document.getElementById('empty-state-btn');
const cancelBtn = document.getElementById('cancel-btn');
const categoriesTableBody = document.getElementById('categories-table-body');
const mobileCategoriesList = document.getElementById('mobile-categories-list');
const emptyState = document.getElementById('empty-state');
const pagination = document.getElementById('pagination');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const toast = document.getElementById('success-toast');
const toastMessage = document.getElementById('toast-message');

let categoryIdToDelete = null;

// Busca todas as categorias da API e renderiza na tela
async function fetchAndRenderCategories() {

    try {
        const response = await fetch(`${apiUrl}/api/finance/categories/`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao buscar categorias.');

        const categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

async function saveCategory(event) {
    event.preventDefault();

    const id = categoryIdInput.value;

    const payload = {
        name: categoryNameInput.value,
        type: categoryTypeSelect.value,
        dre_classification: categoryDreSelect.value,
        dfc_classification: categoryDfcSelect.value
    };

    const url = id ? `${apiUrl}/api/finance/categories/${id}/` : `${apiUrl}/api/finance/categories/`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMsg = 'Erro ao salvar. ';
            for (const field in errorData) {
                errorMsg += `${field}: ${errorData[field].join(', ')}`;
            }
            throw new Error(errorMsg);
        }

        showToast(id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
        resetForm();
        fetchAndRenderCategories();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// Deleta uma categoria
async function deleteCategory() {
    if (!categoryIdToDelete) return;


    try {
        const response = await fetch(`${apiUrl}/api/finance/categories/${categoryIdToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status !== 204) throw new Error('Falha ao excluir a categoria.');

        showToast('Categoria excluída com sucesso!');
        closeDeleteModal();
        fetchAndRenderCategories();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// --- FUNÇÕES DA INTERFACE ---

function renderCategories(categories = []) {
    categoriesTableBody.innerHTML = '';
    mobileCategoriesList.innerHTML = '';

    if (categories.length === 0) {
        emptyState.classList.remove('hidden');
        pagination.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    pagination.classList.remove('hidden'); // Adapte a lógica de paginação se necessário

    categories.forEach(category => {
        const dreLabel = getDreLabel(category.dre_classification);
        const dfcLabel = getDfcLabel(category.dfc_classification);
        const typeLabel = category.type === 'entrada' ? 'Entrada' : 'Saída';
        const typeColor = category.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

        // Tabela Desktop
        const row = document.createElement('tr');
        row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category.name}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}">${typeLabel}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dreLabel}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dfcLabel}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="openEditForm(${category.id})" class="text-fin-blue hover:text-blue-600 mr-4"><i class="fas fa-edit"></i></button>
                    <button onclick="openDeleteModal(${category.id})" class="text-fin-red hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        categoriesTableBody.appendChild(row);

        // Cards Mobile (implementação similar)
        const card = document.createElement('div');
        card.className = 'p-4';
        card.innerHTML = `
    <div class="flex justify-between items-center mb-1">
        <h4 class="text-gray-800 font-semibold text-sm">${category.name}</h4>
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}">${typeLabel}</span>
    </div>
    <p class="text-sm text-gray-500"><strong>DRE:</strong> ${dreLabel}</p>
    <p class="text-sm text-gray-500"><strong>DFC:</strong> ${dfcLabel}</p>
    <div class="mt-2 flex justify-end space-x-3">
        <button onclick="openEditForm(${category.id})" class="text-fin-blue hover:text-blue-600"><i class="fas fa-edit"></i></button>
        <button onclick="openDeleteModal(${category.id})" class="text-fin-red hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
    </div>
`;
        mobileCategoriesList.appendChild(card);
    });
}

function getDreLabel(value) {
    const labels = {
        'receita_bruta': 'Receita Bruta',
        'deducao_venda': 'Dedução de Venda',
        'custos_variaveis': 'Custos Variáveis',
        'despesa_operacional': 'Despesa Operacional',
        'despesa_administrativa': 'Despesa Administrativa',
        'despesa_comercial': 'Despesa Comercial',
        'receita_financeira': 'Receita Financeira',
        'despesa_financeira': 'Despesa Financeira',
        'imposto_lucro': 'Imposto sobre o Lucro',
        'investimento': 'Investimento',
        'nao_se_aplica': 'Não se Aplica'
    };
    // Retorna o valor correspondente do objeto, ou o próprio valor se não encontrar
    return labels[value] || value;
}

function getDfcLabel(value) {
    const labels = {
        'operacional': 'Operacional',
        'investimento': 'Investimento',
        'financiamento': 'Financiamento',
        'nao_se_aplica': 'Não se Aplica'
    };
    // Retorna o valor correspondente do objeto, ou o próprio valor se não encontrar
    return labels[value] || value;
}

function openAddForm() {
    formSection.classList.remove('hidden');
    formTitle.textContent = 'Nova Categoria';
    categoryForm.reset();
    categoryIdInput.value = '';
}

async function openEditForm(id) {

    const response = await fetch(`${apiUrl}/api/finance/categories/${id}/`, {
        credentials: 'include'
    });
    const category = await response.json();

    categoryIdInput.value = category.id;
    categoryNameInput.value = category.name;
    categoryTypeSelect.value = category.type;
    categoryDreSelect.value = category.dre_classification;
    categoryDfcSelect.value = category.dfc_classification;

    formTitle.textContent = 'Editar Categoria';
    formSection.classList.remove('hidden');
    formSection.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    formSection.classList.add('hidden');
    categoryForm.reset();
}

function openDeleteModal(id) {
    categoryIdToDelete = id;
    confirmModal.classList.remove('hidden');
}

function closeDeleteModal() {
    categoryIdToDelete = null;
    confirmModal.classList.add('hidden');
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `fixed bottom-4 right-4 text-white px-4 py-2 rounded-md shadow-lg toast ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    setTimeout(() => { toast.className = 'hidden'; }, 3000);
}

newCategoryBtn.addEventListener('click', openAddForm);
emptyStateBtn.addEventListener('click', openAddForm);
categoryForm.addEventListener('submit', saveCategory);
cancelBtn.addEventListener('click', resetForm);
confirmDeleteBtn.addEventListener('click', deleteCategory);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);