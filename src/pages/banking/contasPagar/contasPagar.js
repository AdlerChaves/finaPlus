const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('pagamentos')
    renderTopbar('movimentacoes', userData.permissions_list);
    setupPage();
    renderMonthlyBills();
    
});


let billIdToModify = null;
let currentMonth = new Date();

const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthDisplay = document.getElementById('current-month-display');

function updateMonthDisplay() {
    const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long' });
    const year = currentMonth.getFullYear();
    currentMonthDisplay.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`;
}

prevMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderMonthlyBills();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderMonthlyBills();
});


function markAsPaid(id) {
    const row = document.querySelector(`button[onclick="markAsPaid(${id})"]`).closest('tr');
    const amountText = row.cells[3].textContent;
    const amountValue = amountText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    openMarkAsPaidModal(id, amountValue);
}

async function openMarkAsPaidModal(billId, billAmount) {

    const modal = document.getElementById('mark-as-paid-modal');
    const accountSelect = document.getElementById('payment-account');

    try {
        const response = await fetch(`${apiUrl}/api/finance/bank-accounts/?is_active=true`, { credentials: 'include' });

        const accounts = await response.json();
        accountSelect.innerHTML = '<option value="">Selecione a conta de origem</option>';
        accounts.forEach(acc => {
            accountSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${formatMoney(acc.initial_balance)})</option>`;
        });
    } catch (error) { console.error(error); }

    document.getElementById('payable-id-input').value = billId;
    document.getElementById('payment-amount').value = parseFloat(billAmount).toFixed(2);
    document.getElementById('payment-date').valueAsDate = new Date();

    modal.classList.remove('hidden');
}

async function confirmPayment(event) {
    event.preventDefault();

    const payableId = document.getElementById('payable-id-input').value;

    const payload = {
        bank_account_id: document.getElementById('payment-account').value,
        amount: document.getElementById('payment-amount').value,
        payment_date: document.getElementById('payment-date').value
    };

    if (!payload.bank_account_id) {
        alert("Por favor, selecione a conta de origem do pagamento.");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/api/finance/payables/${payableId}/mark_as_paid/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao processar pagamento.');

        showToast(data.success);
        document.getElementById('mark-as-paid-modal').classList.add('hidden');
        renderMonthlyBills();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function setupEventListeners() {
    document.getElementById('add-bill-button').addEventListener('click', openAddModal);
    document.getElementById('cancel-modal').addEventListener('click', closeModal);
    document.getElementById('bill-form').addEventListener('submit', savePayable);
    document.getElementById('confirm-delete-btn').addEventListener('click', deletePayable);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('add-card-expense-btn').addEventListener('click', openCardExpenseModal);

    const markAsPaidModal = document.getElementById('mark-as-paid-modal');
    document.getElementById('mark-as-paid-form').addEventListener('submit', confirmPayment);
    document.getElementById('cancel-payment-btn').addEventListener('click', () => markAsPaidModal.classList.add('hidden'));
}
async function loadDynamicModals() {
    try {
        // Agora só carrega o modal de gasto no cartão
        const response = await fetch('/modalGastoCartao.html');
        const cardHtml = await response.text();

        document.getElementById('card-expense-modal-container').innerHTML = cardHtml;
        
        // Listeners do modal de cartão
        document.getElementById('add-card-expense-btn').addEventListener('click', openCardExpenseModal);
        document.getElementById('cancelCardExpenseBtn').addEventListener('click', closeCardExpenseModal);
        document.getElementById('cardExpenseForm').addEventListener('submit', saveCardExpense);

    } catch (error) { 
        console.error("Falha ao carregar componentes:", error); 
    }
}

function setupPage() {
    setupEventListeners();
    loadDynamicModals();
}

const formatMoney = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateString) => { const [y, m, d] = dateString.split('-'); return `${d}/${m}/${y}`; };
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) {
        console.error("Elementos do Toast não encontrados no DOM.");
        return;
    }

    toastMessage.textContent = message;
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toast.className = `fixed bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg toast ${bgColor}`;

    setTimeout(() => {
        toast.className = 'hidden';
    }, 3000);
}

// --- FUNÇÃO PARA RENDERIZAR A TABELA UNIFICADA ---
function renderUnifiedTable(items) {
    const payablesTableBody = document.getElementById('payables-table-body');
    payablesTableBody.innerHTML = '';

    if (items.length === 0) {
        payablesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhuma conta para este mês.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        let statusClass = '';
        let statusText = '';

        // --- LÓGICA DE STATUS UNIFICADA ---
        switch (item.status) {
            case 'pago':
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'Pago';
                row.classList.add('bg-green-50'); // Fundo verde claro para a linha
                break;
            case 'vencido':
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'Vencido';
                row.classList.add('bg-red-50'); // Fundo vermelho claro para a linha
                break;
            default: // 'pendente'
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusText = 'Pendente';
                break;
        }

        if (item.type === 'card') {
            const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), item.due_day);
            row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <i class="fas fa-credit-card text-indigo-500 mr-2"></i>
                            Fatura ${item.card_name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fatura de Cartão</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${formatDate(dueDate.toISOString().split('T')[0])}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">${formatMoney(item.total_amount)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                             <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onclick="viewCardStatement(${item.card_id})" class="text-indigo-600 hover:text-indigo-900 transition-colors" title="Ver Detalhes da Fatura">
                                <i class="fas fa-eye"></i> Ver Detalhes
                            </button>
                        </td>
                    `;
        } else { // é 'manual'
            row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.description}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category_name || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${item.status === 'vencido' ? 'text-red-600 font-bold' : 'text-gray-500'}">${formatDate(item.due_date)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">${formatMoney(item.amount)}</td>
                        <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${statusText}</span></td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            ${item.status !== 'pago' ? `<button onclick="markAsPaid(${item.id})" class="text-green-600 hover:text-green-800 mr-3" title="Marcar como Pago"><i class="fas fa-check-circle"></i></button>` : ''}
                            <button onclick="openEditModal(${item.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar"><i class="fas fa-edit"></i></button>
                            <button onclick="openDeleteModal(${item.id})" class="text-red-500 hover:text-red-700" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    `;
        }
        payablesTableBody.appendChild(row);
    });
}


// --- NOVA FUNÇÃO PARA EXIBIR A FATURA (SIMULADO) ---
function viewCardStatement(cardId) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // Redireciona para a tela de detalhes da fatura, passando os dados via URL
    window.location.href = `/src/pages/banking/detalheFatura/detalheFatura.html?card_id=${cardId}&month=${month}&year=${year}`;
}

async function renderMonthlyBills() {
    updateMonthDisplay();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const url = `${apiUrl}/api/finance/monthly-bills/?month=${month}&year=${year}`;

    try {

        const response = await fetch(url, { credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        if (!response.ok) throw new Error('Falha ao buscar as contas do mês.');

        const data = await response.json();
        const manualItems = data.manual_bills.map(bill => ({ ...bill, type: 'manual' }));
        const cardItems = data.card_bills.map(bill => ({ ...bill, type: 'card' }));
        let allItems = [...manualItems, ...cardItems];
        allItems.sort((a, b) => {
            const dateA = a.type === 'card' ? new Date(year, month - 1, a.due_day) : new Date(a.due_date);
            const dateB = b.type === 'card' ? new Date(year, month - 1, b.due_day) : new Date(b.due_date);
            return dateA - dateB;
        });
        renderUnifiedTable(allItems);
        updateSummaryCards(allItems);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function updateSummaryCards(items) {
    let totalOpen = 0, totalPaid = 0, totalOverdue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {
        const amount = parseFloat(item.amount || item.total_amount);

        if (item.status === 'pago') {
            totalPaid += amount;
        } else { // Se não está pago, está aberto
            totalOpen += amount;
            // Se estiver aberto E vencido, soma também no total vencido
            if (item.status === 'vencido') {
                totalOverdue += amount;
            }
        }
    });

    document.getElementById('summary-total-open').textContent = formatMoney(totalOpen);
    document.getElementById('summary-total-paid').textContent = formatMoney(totalPaid);
    document.getElementById('summary-total-overdue').textContent = formatMoney(totalOverdue);
}

async function populateCategoriesDropdown() {
    const categorySelect = document.getElementById('bill-category');
    try {
        const response = await fetch(`${apiUrl}/api/finance/categories/?type=saida`);
        if (!response.ok) throw new Error('Falha ao carregar categorias.');
        const categories = await response.json();
        categorySelect.innerHTML = '<option value="">Selecione uma Categoria</option>';
        categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (error) {
        categorySelect.innerHTML = '<option value="">Erro ao carregar</option>';
        showToast(error.message, 'error');
    }
}

async function openAddModal() {
    const billForm = document.getElementById('bill-form');
    billForm.reset();
    document.getElementById('modal-title').textContent = 'Nova Conta a Pagar';
    document.getElementById('bill-id').value = '';

    await populateCategoriesDropdown();
    document.getElementById('bill-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('bill-modal').classList.add('hidden');
}

async function savePayable(event) {
    event.preventDefault();

    const id = document.getElementById('bill-id').value;

    // --- LÓGICA DO PAYLOAD CORRIGIDA ---
    const payload = {
        description: document.getElementById('bill-description').value,
        amount: document.getElementById('bill-amount').value,
        due_date: document.getElementById('bill-due-date').value,
        category: document.getElementById('bill-category').value || null,
        // Agora, ele pega o status do campo oculto, ou usa 'pendente' se for uma conta nova
        status: document.getElementById('bill-status').value || 'pendente'
    };

    if (!payload.description || !payload.amount || !payload.due_date) {
        showToast('Descrição, Valor e Data de Vencimento são obrigatórios.', 'error');
        return;
    }

    const url = id ? `${apiUrl}/api/finance/payables/${id}/` : `${apiUrl}/api/finance/payables/`;
    const method = id ? 'PUT' : 'POST';

    const saveButton = document.getElementById('save-bill');
    saveButton.disabled = true;
    saveButton.textContent = 'Salvando...';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro ao salvar: ${JSON.stringify(errorData)}`);
        }
        showToast(id ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
        closeModal();
        renderMonthlyBills();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Salvar';
    }
}

async function openEditModal(id) {
    document.getElementById('bill-id').value = id;
    await populateCategoriesDropdown();
    try {
        const response = await fetch(`${apiUrl}/api/finance/payables/${id}/`, { credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        if (!response.ok) throw new Error('Falha ao buscar dados da conta.');
        const bill = await response.json();
        document.getElementById('modal-title').textContent = 'Editar Conta a Pagar';
        document.getElementById('bill-description').value = bill.description;
        document.getElementById('bill-amount').value = bill.amount;
        document.getElementById('bill-due-date').value = bill.due_date;
        document.getElementById('bill-category').value = bill.category || '';

        // --- LINHA NOVA ADICIONADA AQUI ---
        // Guarda o status atual da conta no campo oculto
        document.getElementById('bill-status').value = bill.status;

        document.getElementById('bill-modal').classList.remove('hidden');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openDeleteModal(id) {
    billIdToModify = id;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    billIdToModify = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

async function deletePayable() {
    if (!billIdToModify) return;
    try {
        const response = await fetch(`${apiUrl}/api/finance/payables/${billIdToModify}/`, {
            method: 'DELETE',
            credentials: 'include' // CORRIGIDO
        });
        if (response.status !== 204) {
            throw new Error('Erro ao excluir a conta.');
        }
        showToast('Conta excluída com sucesso!');
        closeDeleteModal();
        renderMonthlyBills();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function openCardExpenseModal() {
    const cardSelect = document.getElementById('card-expense-card');
    const categorySelect = document.getElementById('card-expense-category');
    try {
        const [cardsRes, catRes] = await Promise.all([
            fetch(`${apiUrl}/api/finance/credit-cards/?is_active=true`, { credentials: 'include' }), // CORRIGIDO
            fetch(`${apiUrl}/api/finance/categories/?type=saida`, { credentials: 'include' }) // CORRIGIDO
        ]);
        const cards = await cardsRes.json();
        const categories = await catRes.json();
        cardSelect.innerHTML = '<option value="">Selecione um cartão</option>';
        cards.forEach(c => { cardSelect.innerHTML += `<option value="${c.id}">${c.name} (final ${c.last_digits})</option>`; });
        categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        categories.forEach(c => { categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
        document.getElementById('cardExpenseModal').classList.remove('hidden');
    } catch (error) {
        console.error(error);
        showToast('Erro ao carregar dados para o formulário.', 'error');
    }
}

function closeCardExpenseModal() {
    document.getElementById('cardExpenseModal').classList.add('hidden');
}

async function saveCardExpense(event) {
    event.preventDefault();

    const saveButton = document.getElementById('saveCardExpenseBtn');
    const payload = {
        description: document.getElementById('card-expense-description').value,
        amount: document.getElementById('card-expense-amount').value,
        installments: document.getElementById('card-expense-installments').value,
        credit_card_id: document.getElementById('card-expense-card').value,
        category_id: document.getElementById('card-expense-category').value,
        transaction_date: document.getElementById('card-expense-date').value,
    };

    if (!payload.description || !payload.amount || !payload.credit_card_id || !payload.category_id || !payload.transaction_date) {
        showToast("Por favor, preencha todos os campos obrigatórios.", "error");
        return;
    }
    saveButton.disabled = true;
    saveButton.textContent = 'Criando...';

    try {
        const response = await fetch(`${apiUrl}/api/finance/card-expense/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ocorreu um erro ao registrar a despesa.');
        }
        showToast(data.success || 'Despesa registrada com sucesso!');
        document.getElementById('cardExpenseForm').reset(); // Limpa os campos do formulário

        closeCardExpenseModal();
        renderMonthlyBills();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Criar Parcelas';
    }
}

window.markAsPaid = markAsPaid;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.viewCardStatement = viewCardStatement;
