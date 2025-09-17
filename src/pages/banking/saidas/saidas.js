const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('movimentacoes');
    renderExpenses();
    renderTopbar('movimentacoes', userData.permissions_list);
});

// --- DOM ELEMENTS ---
const expenseModal = document.getElementById('expenseModal');
const deleteModal = document.getElementById('delete-modal');
const addExpenseHeaderBtn = document.getElementById('add-expense-header-btn');
const addExpenseFabBtn = document.getElementById('addExpenseBtn');
const expenseForm = document.getElementById('expenseForm');
const expensesTableBody = document.getElementById('expensesTableBody');
const categorySelect = document.getElementById('expense-category');
const accountSelect = document.getElementById('expense-account');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
const totalExpensesEl = document.getElementById('totalExpenses');
const totalExpensesSummary = document.getElementById('total-expenses-summary');

let transactionIdToDelete = null;
let expenseChart = null;
let statusChart = null;

// --- FUNÇÕES DE UTILIDADE E FEEDBACK ---
const formatMoney = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => { const [y, m, d] = dateString.split('-'); return `${d}/${m}/${y}`; };

function showToast(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-600';
    toastNotification.className = `fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white ${bgColor}`;
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => { toastNotification.classList.add('hidden'); }, 3000);
}

// --- FUNÇÕES DE GRÁFICOS ---
function updateCharts(expenses) {
    const categoriesData = expenses.reduce((acc, expense) => {
        const categoryName = expense.category_name || 'Sem Categoria';
        acc[categoryName] = (acc[categoryName] || 0) + parseFloat(expense.amount);
        return acc;
    }, {});
    const accountsData = expenses.reduce((acc, expense) => {
        const accountName = expense.bank_account_name || 'Conta Deletada';
        acc[accountName] = (acc[accountName] || 0) + parseFloat(expense.amount);
        return acc;
    }, {});

    if (expenseChart) expenseChart.destroy();
    if (statusChart) statusChart.destroy();

    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctxExpense, {
        type: 'doughnut',
        data: { labels: Object.keys(categoriesData), datasets: [{ data: Object.values(categoriesData), backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(ctxStatus, {
        type: 'bar',
        data: { labels: Object.keys(accountsData), datasets: [{ label: 'Total Gasto', data: Object.values(accountsData), backgroundColor: '#8B5CF6' }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });
}

// --- FUNÇÕES DA API E RENDERIZAÇÃO ---
async function populateDropdowns(t) {
    try {
        // --- A CORREÇÃO ESTÁ NA URL DESTA REQUISIÇÃO ---
        const [catRes, accRes] = await Promise.all([
            // Adicionamos ?type=saida para filtrar apenas as categorias de despesa
            fetch(`${apiUrl}/api/finance/categories/?type=saida`, { credentials: 'include' }),
            fetch(`${apiUrl}/api/finance/bank-accounts/`, { credentials: 'include' })
        ]);

        if (catRes.status === 401 || accRes.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        if (!catRes.ok || !accRes.ok) {
            throw new Error('Falha ao carregar dados para o formulário.');
        }

        const categories = await catRes.json();
        const accounts = await accRes.json();

        categorySelect.innerHTML = '<option value="">Selecione a Categoria</option>';
        categories.forEach(c => {
            categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        accountSelect.innerHTML = '<option value="">Selecione a Conta</option>';
        // Filtramos para mostrar apenas contas ativas no dropdown
        accounts.filter(a => a.is_active).forEach(a => {
            accountSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
        });

    } catch (error) {
        console.error('Erro ao popular dropdowns:', error);
        showToast(error.message, 'error'); // Mostra um feedback de erro
    }
}

async function renderExpenses() {

    await populateDropdowns();

    try {
        // ADICIONADO: 'credentials: 'include''
        const response = await fetch(`${apiUrl}/api/finance/transactions/?type=saida`, { credentials: 'include' });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) throw new Error('Falha ao buscar despesas.');

        const expenses = await response.json();
        // ... (resto da sua lógica de renderização é mantida) ...
        const expensesListMobile = document.getElementById('expenses-list-mobile');
        const expensesTableBody = document.getElementById('expensesTableBody');
        expensesTableBody.innerHTML = '';
        expensesListMobile.innerHTML = '';

        if (expenses.length === 0) {
            const emptyMessageTable = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma despesa registrada.</td></tr>`;
            expensesTableBody.innerHTML = emptyMessageTable;
            expensesListMobile.innerHTML = `<p class="text-center py-4 text-gray-500">Nenhuma despesa registrada.</p>`;
            totalExpensesSummary.textContent = formatMoney(0);
            updateCharts([]);
            return;
        }

        const totalValue = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        totalExpensesSummary.textContent = formatMoney(totalValue);

        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${expense.description}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">${formatMoney(expense.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.category_name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(expense.transaction_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.bank_account_name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openEditModal(${expense.id})" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                        <button onclick="openDeleteModal(${expense.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            expensesTableBody.appendChild(row);

            const card = document.createElement('div');
            card.className = 'p-4 border-b border-gray-200';
            card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-gray-800">${expense.description}</p>
                            <p class="text-sm text-gray-500">${expense.category_name || 'N/A'}</p>
                            <p class="text-xs text-gray-400 mt-1">${formatDate(expense.transaction_date)}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-red-600">${formatMoney(expense.amount)}</p>
                            <div class="mt-2">
                                <button onclick="openEditModal(${expense.id})" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fas fa-edit"></i></button>
                                <button onclick="openDeleteModal(${expense.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            expensesListMobile.appendChild(card);
        });

        updateCharts(expenses);
    } catch (error) { showToast(error.message, 'error'); }
}

// --- LÓGICA DO MODAL E CRUD ---
function openAddModal() {
    expenseForm.reset();
    document.getElementById('modal-title').textContent = 'Adicionar Nova Saída';
    document.getElementById('transaction-id').value = '';
    expenseModal.classList.remove('hidden');
}

async function openEditModal(id) {

    const response = await fetch(`${apiUrl}/api/finance/transactions/${id}/`, { credentials: 'include' });
    if (response.status === 401) { window.location.href = 'login.html'; return; }
    const expense = await response.json();
    document.getElementById('modal-title').textContent = 'Editar Saída';
    document.getElementById('transaction-id').value = expense.id;
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-date').value = expense.transaction_date;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-account').value = expense.bank_account;
    document.getElementById('expense-notes').value = expense.notes;
    expenseModal.classList.remove('hidden');
}

function closeModal() { expenseModal.classList.add('hidden'); }

async function saveTransaction(event) {
    event.preventDefault();
    const id = document.getElementById('transaction-id').value;
    const payload = {
        description: document.getElementById('expense-description').value,
        amount: document.getElementById('expense-amount').value,
        transaction_date: document.getElementById('expense-date').value,
        category: document.getElementById('expense-category').value,
        bank_account: document.getElementById('expense-account').value,
        notes: document.getElementById('expense-notes').value,
        type: 'saida'
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
        if (!response.ok) throw new Error('Erro ao salvar a despesa.');
        showToast(id ? 'Saída atualizada com sucesso!' : 'Saída adicionada com sucesso!');
        closeModal();
        renderExpenses();
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
        if (response.status !== 204) throw new Error('Erro ao excluir a despesa.');
        showToast('Despesa excluída com sucesso!');
        closeDeleteModal();
        renderExpenses();
    } catch (error) { showToast(error.message, 'error'); }
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', renderExpenses);
addExpenseHeaderBtn.addEventListener('click', openAddModal);
addExpenseFabBtn.addEventListener('click', openAddModal);
expenseForm.addEventListener('submit', saveTransaction);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelButton').addEventListener('click', closeModal);
document.getElementById('confirm-delete-btn').addEventListener('click', deleteTransaction);
document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);


