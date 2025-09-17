const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('movimentacoes');
    renderTopbar('movimentacoes', userData.permissions_list);
});


// --- DOM ELEMENTS ---
const incomeModal = document.getElementById('income-modal');
const deleteModal = document.getElementById('delete-modal');
const addIncomeHeaderBtn = document.getElementById('add-income-header-btn');
const addIncomeFabBtn = document.getElementById('add-income-fab-btn');
const incomeForm = document.getElementById('income-form');
const incomeTableBody = document.getElementById('income-table-body');
const totalIncomeSummary = document.getElementById('total-income-summary');
const categorySelect = document.getElementById('income-category');
const accountSelect = document.getElementById('income-account');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

let transactionIdToDelete = null;
let incomeByCategoryChart = null;
let incomeByAccountChart = null;

// --- FUNÇÕES DE UTILIDADE E FEEDBACK ---
const formatMoney = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => { const [y, m, d] = dateString.split('-'); return `${d}/${m}/${y}`; };

function showToast(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-600';
    toastNotification.className = `fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${bgColor}`;
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => { toastNotification.classList.add('hidden'); }, 3000);
}

function updateCharts(incomeList) {
    // Agrupa os dados por categoria
    const categoriesData = incomeList.reduce((acc, income) => {
        const categoryName = income.category_name || 'Sem Categoria';
        acc[categoryName] = (acc[categoryName] || 0) + parseFloat(income.amount);
        return acc;
    }, {});

    // Agrupa os dados por conta
    const accountsData = incomeList.reduce((acc, income) => {
        const accountName = income.bank_account_name || 'Conta Deletada';
        acc[accountName] = (acc[accountName] || 0) + parseFloat(income.amount);
        return acc;
    }, {});

    // Destrói os gráficos antigos para evitar sobreposição
    if (incomeByCategoryChart) incomeByCategoryChart.destroy();
    if (incomeByAccountChart) incomeByAccountChart.destroy();

    // Cria o gráfico de Entradas por Categoria (Doughnut)
    const ctxCategory = document.getElementById('income-by-category-chart').getContext('2d');
    incomeByCategoryChart = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoriesData),
            datasets: [{
                data: Object.values(categoriesData),
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EF4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Cria o gráfico de Entradas por Conta (Barra)
    const ctxAccount = document.getElementById('income-by-account-chart').getContext('2d');
    incomeByAccountChart = new Chart(ctxAccount, {
        type: 'bar',
        data: {
            labels: Object.keys(accountsData),
            datasets: [{
                label: 'Total Recebido',
                data: Object.values(accountsData),
                backgroundColor: '#8B5CF6'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });
}

// --- FUNÇÕES DA API E RENDERIZAÇÃO ---
async function populateDropdowns() {
    try {
        const [catRes, accRes] = await Promise.all([
            fetch(`${apiUrl}/api/finance/categories/?type=entrada`, { credentials: 'include' }),
            fetch(`${apiUrl}/api/finance/bank-accounts/`, { credentials: 'include' })
        ]);

        // Adicionada verificação de status 401
        if (catRes.status === 401 || accRes.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const categories = await catRes.json();
        const accounts = await accRes.json();

        categorySelect.innerHTML = '<option value="">Selecione a Categoria</option>';
        categories.forEach(c => { categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`; });

        accountSelect.innerHTML = '<option value="">Selecione a Conta</option>';
        accounts.filter(a => a.is_active).forEach(a => { accountSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`; });
    } catch (error) { showToast('Erro ao carregar dados.', 'error'); }
}

async function renderIncome() {

    await populateDropdowns();

    try {
        // ADICIONADO: 'credentials: 'include''
        const response = await fetch(`${apiUrl}/api/finance/transactions/?type=entrada`, { credentials: 'include' });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) throw new Error('Falha ao buscar entradas.');

        const incomeList = await response.json();
        // ... (resto da lógica de renderização inalterada) ...
        const incomeListMobile = document.getElementById('income-list-mobile');
        incomeTableBody.innerHTML = '';
        incomeListMobile.innerHTML = '';
        if (incomeList.length === 0) {
            const emptyMessage = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma entrada registrada.</td></tr>`;
            incomeTableBody.innerHTML = emptyMessage;
            incomeListMobile.innerHTML = `<p class="text-center py-4 text-gray-500">Nenhuma entrada registrada.</p>`;
            totalIncomeSummary.textContent = formatMoney(0);
            updateCharts([]);
            return;
        }
        const totalValue = incomeList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        totalIncomeSummary.textContent = formatMoney(totalValue);
        incomeList.forEach(income => {
            const row = document.createElement('tr');
            row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(income.transaction_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${income.description}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${income.category_name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${income.bank_account_name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${formatMoney(income.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openEditModal(${income.id})" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                        <button onclick="openDeleteModal(${income.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            incomeTableBody.appendChild(row);
            const card = document.createElement('div');
            card.className = 'p-4 border-b border-gray-200';
            card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-gray-800">${income.description}</p>
                            <p class="text-sm text-gray-500">${income.category_name || 'N/A'}</p>
                            <p class="text-xs text-gray-400 mt-1">${formatDate(income.transaction_date)}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-green-600">${formatMoney(income.amount)}</p>
                            <div class="mt-2">
                                <button onclick="openEditModal(${income.id})" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fas fa-edit"></i></button>
                                <button onclick="openDeleteModal(${income.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            incomeListMobile.appendChild(card);
        });
        updateCharts(incomeList);
    } catch (error) { showToast(error.message, 'error'); }
}

// --- LÓGICA DO MODAL E CRUD ---

function openAddModal() {
    incomeForm.reset();
    document.getElementById('modal-title').textContent = 'Adicionar Nova Entrada';
    document.getElementById('transaction-id').value = '';
    incomeModal.classList.remove('hidden');
}

async function openEditModal(id) {

    const response = await fetch(`${apiUrl}/api/finance/transactions/${id}/`, { credentials: 'include' });
    const income = await response.json();

    document.getElementById('modal-title').textContent = 'Editar Entrada';
    document.getElementById('transaction-id').value = income.id;
    document.getElementById('income-description').value = income.description;
    document.getElementById('income-amount').value = income.amount;
    document.getElementById('income-date').value = income.transaction_date;
    document.getElementById('income-category').value = income.category;
    document.getElementById('income-account').value = income.bank_account;

    incomeModal.classList.remove('hidden');
}

function closeModal() { incomeModal.classList.add('hidden'); }

async function saveTransaction(event) {
    event.preventDefault();

    const id = document.getElementById('transaction-id').value;
    const payload = {
        description: document.getElementById('income-description').value,
        amount: document.getElementById('income-amount').value,
        transaction_date: document.getElementById('income-date').value,
        category: document.getElementById('income-category').value,
        bank_account: document.getElementById('income-account').value,
        type: 'entrada' // Fixo para esta tela
    };
    const url = id ? `${apiUrl}/api/finance/transactions/${id}/` : `${apiUrl}/api/finance/transactions/`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Erro ao salvar a entrada.');

        showToast(id ? 'Entrada atualizada com sucesso!' : 'Entrada adicionada com sucesso!');
        closeModal();
        renderIncome();
    } catch (error) { showToast(error.message, 'error'); }
}

function openDeleteModal(id) {
    transactionIdToDelete = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    transactionIdToDelete = null;
    deleteModal.classList.add('hidden');
}

async function deleteTransaction() {
    if (!transactionIdToDelete) return;

    try {
        const response = await fetch(`${apiUrl}/api/finance/transactions/${transactionIdToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.status !== 204) throw new Error('Erro ao excluir a entrada.');

        showToast('Entrada excluída com sucesso!');
        closeDeleteModal();
        renderIncome();
    } catch (error) { showToast(error.message, 'error'); }
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', renderIncome);
addIncomeHeaderBtn.addEventListener('click', openAddModal);
addIncomeFabBtn.addEventListener('click', openAddModal);
incomeForm.addEventListener('submit', saveTransaction);
document.getElementById('close-modal-btn').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('confirm-delete-btn').addEventListener('click', deleteTransaction);
document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
