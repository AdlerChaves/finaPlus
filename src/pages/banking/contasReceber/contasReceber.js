const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('pagamentos')
    renderTopbar('pagamentos', userData.permissions_list);
    fetchClients();
    fetchBankAccounts();
    fetchReceivables();

});


const receivableModal = document.getElementById('receivable-modal');
const receivableForm = document.getElementById('receivable-form');
const receivablesTableBody = document.getElementById('receivables-table-body');
const receivablesMobileList = document.getElementById('receivables-mobile-list');

// --- FUNÇÕES DE RENDERIZAÇÃO ---
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getStatusBadge = (status, dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);

    if (status === 'received') {
        return '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Recebido</span>';
    } else if (due < today) {
        return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><i class="fas fa-exclamation-circle mr-1"></i>Vencido</span>';
    } else {
        return '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>Pendente</span>';
    }
};

let statusChart = null; // Variável global para guardar a instância do gráfico

const fetchSummaryData = async (params) => {
    try {

        const response = await fetch(`${apiUrl}/api/finance/receivables-summary/?${params.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const summary = await response.json();
        if (summary) {
            updateSummaryCards(summary);
            renderStatusChart(summary.chart_data);
        }
    } catch (error) {
        console.error("Erro ao buscar dados de resumo:", error);
    }
};

const updateSummaryCards = (summary) => {
    document.getElementById('total-to-receive').textContent = formatCurrency(summary.total_to_receive);
    document.getElementById('total-received').textContent = formatCurrency(summary.total_received);
};

const renderStatusChart = (chartData) => {
    const ctx = document.getElementById('statusChart').getContext('2d');

    // Se o gráfico já existe, o destruímos para criar um novo com dados atualizados
    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut', // Tipo de gráfico: rosca
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Total por Status',
                data: chartData.data,
                backgroundColor: [
                    '#F59E0B', // Amarelo para Pendente
                    '#10B981', // Verde para Recebido
                    '#EF4444', // Vermelho para Vencido
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
};

const renderReceivables = (receivables) => {
    receivablesTableBody.innerHTML = '';
    receivablesMobileList.innerHTML = '';

    if (receivables.length === 0) {
        const emptyMessage = `<td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Nenhuma conta a receber encontrada.</td>`;
        receivablesTableBody.innerHTML = `<tr>${emptyMessage}</tr>`;
        receivablesMobileList.innerHTML = `<div class="p-4">${emptyMessage}</div>`;
        return;
    }

    receivables.forEach(receivable => {
        const actionsHtml = `
                    <button class="edit-btn text-blue-500 hover:text-blue-700 mr-3" data-id="${receivable.id}">Editar</button>
                    ${receivable.status === 'pending' ?
                `<button class="mark-received-btn text-green-500 hover:text-green-700 mr-3" data-id="${receivable.id}">Receber</button>` : ''}
                    <button class="delete-btn text-red-500 hover:text-red-700" data-id="${receivable.id}">Excluir</button>
                `;

        // Desktop row
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${receivable.customer_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${receivable.description}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatCurrency(receivable.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(receivable.due_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${getStatusBadge(receivable.status, receivable.due_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionsHtml}</td>
                `;
        receivablesTableBody.appendChild(row);
        // Adicione a lógica para cards mobile se necessário
    });
};

const populateClientSelects = (clients) => {
    const clientFilter = document.getElementById('client-filter');
    const clientModalSelect = document.getElementById('customer_id');

    // Limpa as opções existentes
    clientFilter.innerHTML = '<option value="">Todos</option>';
    clientModalSelect.innerHTML = '';

    // Adiciona a opção padrão, que é desabilitada para seleção
    clientModalSelect.innerHTML += '<option value="" disabled selected>Selecione um cliente</option>';

    // Adiciona a opção "Não Definir" em negrito
    clientModalSelect.innerHTML += '<option value="null" class="font-bold">Não Definir</option>';

    // Adiciona os clientes vindos da API
    clients.forEach(client => {
        const optionHtml = `<option value="${client.id}">${client.name}</option>`;
        clientFilter.innerHTML += optionHtml;
        clientModalSelect.innerHTML += optionHtml;
    });

    // Adiciona a opção para criar um novo cliente
    clientModalSelect.innerHTML += '<option value="new_customer" class="text-blue-500 font-bold">-- Novo Cliente --</option>';
};

const showToast = (message, type = 'success') => { /* ... (função inalterada) ... */ };

// --- LÓGICA DA API ---
const fetchClients = async () => {
    try {
        const response = await fetch(`${apiUrl}/api/cadastros/customers/`, { method: 'GET', credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const clients = await response.json();
        if (clients) populateClientSelects(clients);
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
    }
};

const fetchBankAccounts = async () => {
    try {
        const response = await fetch(`${apiUrl}/api/finance/bank-accounts/`, { method: 'GET', credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const accounts = await response.json();
        if (accounts) {
            populateBankAccountSelect(accounts.results || accounts);
        }
    } catch (error) {
        console.error("Erro ao buscar contas bancárias:", error);
        showToast("Não foi possível carregar as contas bancárias.", 'error');
    }
};

const populateBankAccountSelect = (accounts) => {
    const bankAccountSelect = document.getElementById('bank_account_id');
    if (!bankAccountSelect) return;

    bankAccountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta</option>';
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name; // Assumindo que o modelo tem um campo 'name'
        bankAccountSelect.appendChild(option);
    });
};

const fetchReceivables = async () => {
    const params = new URLSearchParams();
    const period = document.getElementById('period-filter').value;
    if (period) params.append('period-filter', period); // Enviando o período no formato YYYY-MM

    const status = document.getElementById('status-filter').value;
    if (status) params.append('status', status);

    const clientId = document.getElementById('client-filter').value;
    if (clientId) params.append('client_id', clientId);

    const search = document.getElementById('search-input').value;
    if (search) params.append('search', search);

    // Chamada para os dados de resumo (cartões e gráfico)
    fetchSummaryData(params);

    try {
        const response = await fetch(`${apiUrl}/api/finance/receivables/?${params.toString()}`, { method: 'GET', credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const data = await response.json();
        if (data) renderReceivables(data.results || data);
    } catch (error) {
        console.error("Erro ao buscar contas a receber:", error);
    }
};

const saveReceivable = async (event) => {
    event.preventDefault();
    if (!receivableForm.checkValidity()) {
        receivableForm.reportValidity();
        return;
    }
    const formData = new FormData(receivableForm);
    const receivableId = formData.get('id');
    const data = Object.fromEntries(formData.entries());
    if (data.customer_id === 'null') data.customer_id = null;

    const method = receivableId ? 'PATCH' : 'POST';

    const endpoint = receivableId ? `${apiUrl}/api/finance/receivables/${receivableId}/` : `${apiUrl}/api/finance/receivables/`;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Necessário para enviar os cookies
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Falha ao salvar a conta.');
        }

        showToast(`Conta ${receivableId ? 'atualizada' : 'criada'} com sucesso!`);
        closeModal();
        fetchReceivables();
    } catch (error) {
        console.error("Erro ao salvar conta:", error);
        showToast(error.message, 'error');
    }
};

const handleEdit = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/api/finance/receivables/${id}/`, { method: 'GET', credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const receivable = await response.json();
        if (receivable) {
            document.getElementById('modal-title').textContent = 'Editar Conta a Receber';
            document.getElementById('receivable-id').value = receivable.id;
            document.getElementById('customer_id').value = receivable.customer.id;
            document.getElementById('description').value = receivable.description;
            document.getElementById('amount').value = receivable.amount;
            document.getElementById('due_date').value = receivable.due_date;
            document.getElementById('payment_method').value = receivable.payment_method;
            document.getElementById('notes').value = receivable.notes || '';
            receivableModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro ao buscar dados para edição:", error);
    }
};

const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
        try {
            const response = await fetch(`${apiUrl}/api/finance/receivables/${id}/`, { method: 'DELETE', credentials: 'include' });
            if (response.status !== 204) throw new Error('Falha ao excluir.');
            showToast('Conta excluída com sucesso!');
            fetchReceivables();
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
        }
    }
};

const handleMarkAsReceived = async (id) => {
    try {
        // Busca os dados da conta para obter o valor
        const response = await fetch(`${apiUrl}/api/finance/receivables/${id}/`, { method: 'GET', credentials: 'include' });
        if (response.status === 401) { window.location.href = 'login.html'; return; }
        const receivable = await response.json();
        if (receivable) {
            const form = document.getElementById('mark-as-received-form');

            // Preenche o formulário do novo modal
            form.querySelector('#mark-as-received-receivable-id').value = receivable.id;
            form.querySelector('#received_amount').value = receivable.amount;
            form.querySelector('#payment_date').value = new Date().toISOString().split('T')[0];

            // Abre o modal
            document.getElementById('mark-as-received-modal').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro ao preparar modal de recebimento:", error);
    }
};

// --- MODAL ---
const openModal = () => {
    document.getElementById('modal-title').textContent = 'Adicionar Conta a Receber';
    receivableForm.reset();
    document.getElementById('receivable-id').value = '';
    receivableModal.classList.remove('hidden');
};
const closeModal = () => receivableModal.classList.add('hidden');

// --- INICIALIZAÇÃO E EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO FILTRO DE MÊS CORRENTE ---
    const periodFilter = document.getElementById('period-filter');
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    periodFilter.value = currentMonth;

    // --- EVENT LISTENERS ---
    // Eventos do modal principal
    document.getElementById('add-receivable-btn').addEventListener('click', openModal);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-modal').addEventListener('click', closeModal);
    receivableForm.addEventListener('submit', saveReceivable);

    // --- EVENTOS DOS FILTROS (ATUALIZAÇÃO AUTOMÁTICA) ---
    document.getElementById('status-filter').addEventListener('change', fetchReceivables);
    document.getElementById('client-filter').addEventListener('change', fetchReceivables);
    document.getElementById('period-filter').addEventListener('change', fetchReceivables); // Também para o filtro de período
    document.getElementById('search-input').addEventListener('input', fetchReceivables);

    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('period-filter').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('client-filter').value = '';
        document.getElementById('search-input').value = '';
        fetchReceivables();
    });

    // Delegação de eventos para botões de ação na tabela
    document.getElementById('receivables-table-body').addEventListener('click', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id');
        if (!id) return;

        if (target.classList.contains('edit-btn')) handleEdit(id);
        if (target.classList.contains('delete-btn')) handleDelete(id);
        if (target.classList.contains('mark-received-btn')) handleMarkAsReceived(id);
    });

    // Evento para o dropdown de clientes no modal
    document.getElementById('customer_id').addEventListener('change', (e) => {
        if (e.target.value === 'new_customer') {
            window.location.href = 'clientes.html';
        }
    });

    // Eventos para o modal de recebimento
    const markAsReceivedModal = document.getElementById('mark-as-received-modal');
    const markAsReceivedForm = document.getElementById('mark-as-received-form');
    const closeMarkAsReceivedModal = () => markAsReceivedModal.classList.add('hidden');
    document.getElementById('close-mark-as-received-modal').addEventListener('click', closeMarkAsReceivedModal);
    document.getElementById('cancel-mark-as-received-modal').addEventListener('click', closeMarkAsReceivedModal);
    markAsReceivedForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!markAsReceivedForm.checkValidity()) {
            markAsReceivedForm.reportValidity();
            return;
        }
        const receivableId = document.getElementById('mark-as-received-receivable-id').value;
        const data = {
            bank_account_id: document.getElementById('bank_account_id').value,
            payment_date: document.getElementById('payment_date').value,
        };
        try {

            const response = await fetch(`${apiUrl}/api/finance/receivables/${receivableId}/mark-as-received/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Falha ao marcar como recebido.');
            showToast('Conta marcada como recebida!');
            document.getElementById('mark-as-received-modal').classList.add('hidden');
            fetchReceivables();
        } catch (error) {
            console.error("Erro ao marcar como recebido:", error);
        }
    });
});