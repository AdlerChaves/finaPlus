const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../componentes/auth.js";
import { renderTopbar } from "../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));
let customerIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
    loadCustomers();

    document.getElementById('confirm-delete-btn').addEventListener('click', deleteCustomer);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('close-details-modal-btn').addEventListener('click', closeDetailsModal);
});

async function loadCustomers() {

    try {
        const response = await fetch(`${apiUrl}/api/cadastros/customers/`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login.html';
            return;
        }
        if (!response.ok) throw new Error('Falha ao buscar clientes.');

        const customers = await response.json();
        renderCustomerList(customers);

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function renderCustomerList(customers) {
    const tableBody = document.getElementById('customer-table-body');
    const mobileList = document.getElementById('customer-list-mobile');
    const summaryTotal = document.getElementById('summary-total');
    const summaryActive = document.getElementById('summary-active');
    const summaryInactive = document.getElementById('summary-inactive');

    tableBody.innerHTML = '';
    mobileList.innerHTML = '';

    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.status === 'active').length;
    const inactiveCount = totalCount - activeCount;

    summaryTotal.textContent = totalCount;
    summaryActive.textContent = activeCount;
    summaryInactive.textContent = inactiveCount;
    // --- FIM DA LÓGICA DE ATUALIZAÇÃO ---

    if (customers.length === 0) {
        const emptyMessage = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum cliente cadastrado.</td></tr>';
        tableBody.innerHTML = emptyMessage;
        mobileList.innerHTML = `<p class="text-center py-4 text-gray-500">Nenhum cliente cadastrado.</p>`;
        return;
    }

    customers.forEach(customer => {
        const statusClass = customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const initials = (customer.name.split(' ').map(n => n[0]).join('') || 'C').substring(0, 2).toUpperCase();

        // Desktop Row
        const row = document.createElement('tr');
        row.className = 'clickable-card hover:bg-gray-50';
        // Adiciona o evento de clique na linha inteira
        row.onclick = () => openDetailsModal(customer.id);
        row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-semibold">${initials}</div><div class="ml-4"><div class="text-sm font-medium text-gray-900">${customer.name}</div><div class="text-sm text-gray-500">${customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</div></div></div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.document}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.phone}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${customer.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="event.stopPropagation(); editCustomer(${customer.id})" class="text-blue-500 hover:text-blue-700 mr-3"><i class="fas fa-edit"></i></button>
                        <button onclick="event.stopPropagation(); confirmDeleteCustomer(${customer.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                    </td>
                `;
        tableBody.appendChild(row);

        // Mobile Card
        const card = document.createElement('div');
        card.className = 'p-4 clickable-card hover:bg-gray-50';
        // Adiciona o evento de clique no card inteiro
        card.onclick = () => openDetailsModal(customer.id);
        card.innerHTML = `
                    <div class="flex items-start">
                        <div class="flex-1">
                            <div class="flex justify-between">
                                <div><p class="text-sm font-medium text-gray-900">${customer.name}</p><p class="text-xs text-gray-500">${customer.document}</p></div>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${customer.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <div class="mt-2 flex justify-end space-x-2">
                                <button onclick="event.stopPropagation(); editCustomer(${customer.id})" class="text-blue-500 text-sm"><i class="fas fa-edit"></i></button>
                                <button onclick="event.stopPropagation(); confirmDeleteCustomer(${customer.id})" class="text-red-500 text-sm"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
        mobileList.appendChild(card);
    });
}

// --- FUNÇÃO DE FEEDBACK (TOAST) ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toast.className = `fixed bottom-4 right-4 bg-${type === 'success' ? 'green' : 'red'}-500 text-white px-4 py-2 rounded-lg shadow-lg`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

// --- FUNÇÕES DE AÇÃO ---

function editCustomer(customerId) {
    window.location.href = `cadastroClientes.html?id=${customerId}`;
}

function confirmDeleteCustomer(id) {
    customerIdToDelete = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    customerIdToDelete = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

async function deleteCustomer() {
    if (!customerIdToDelete) return; // Não faz nada se não houver ID


    let success = false;
    let errorMessage = 'Ocorreu um erro desconhecido.';

    try {
        const response = await fetch(`${apiUrl}/api/cadastros/customers/${customerIdToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });

        // Verifica se a exclusão foi bem-sucedida (código 204)
        if (response.status === 204) {
            success = true;
        } else {
            // Tenta obter uma mensagem de erro mais específica do backend
            const errorData = await response.json().catch(() => null);
            errorMessage = errorData?.detail || `Erro ${response.status}: Falha ao excluir o cliente.`;
        }
    } catch (networkError) {
        // Captura erros de rede (ex: sem internet)
        errorMessage = 'Erro de conexão. Não foi possível contatar o servidor.';
    }

    // --- Atualiza a interface DEPOIS de ter o resultado ---

    // 1. Fecha o modal de confirmação em qualquer caso
    closeDeleteModal();

    // 2. Mostra a notificação e atualiza a lista
    if (success) {
        showToast('Cliente excluído com sucesso!', 'success');
        loadCustomers(); // Esta é a linha crucial que atualiza a lista
    } else {
        showToast(errorMessage, 'error');
    }
}
async function openDetailsModal(customerId) {
    const modal = document.getElementById('detailsModal');
    const contentDiv = document.getElementById('details-modal-content');
    contentDiv.innerHTML = '<p class="text-center text-gray-500">Carregando...</p>';
    modal.classList.remove('hidden');

    try {
        const response = await fetch(`${apiUrl}/api/cadastros/customers/${customerId}/`, {
            credentials: 'include'
        });
        if (response.status === 401) { window.location.href = '../login.html'; return; }

        if (!response.ok) throw new Error('Falha ao carregar detalhes do cliente.');

        const customer = await response.json();

        let addressHTML = '<p class="text-sm text-gray-500">Endereço não cadastrado.</p>';
        if (customer.address) {
            const addr = customer.address;
            addressHTML = `
                        <p>${addr.street}, ${addr.number} ${addr.complement ? `- ${addr.complement}` : ''}</p>
                        <p>${addr.neighborhood} - ${addr.city}/${addr.state}</p>
                        <p>CEP: ${addr.cep}</p>
                    `;
        }

        contentDiv.innerHTML = `
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Nome/Razão Social</dt><dd class="mt-1 text-sm text-gray-900">${customer.name}</dd></div>
                        <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">${customer.customer_type === 'PF' ? 'CPF' : 'CNPJ'}</dt><dd class="mt-1 text-sm text-gray-900">${customer.document}</dd></div>
                        <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">E-mail</dt><dd class="mt-1 text-sm text-gray-900">${customer.email}</dd></div>
                        <div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Telefone</dt><dd class="mt-1 text-sm text-gray-900">${customer.phone}</dd></div>
                        ${customer.customer_type === 'PF' && customer.birth_date ? `<div class="sm:col-span-1"><dt class="text-sm font-medium text-gray-500">Data de Nascimento</dt><dd class="mt-1 text-sm text-gray-900">${new Date(customer.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</dd></div>` : ''}
                        <div class="sm:col-span-2"><dt class="text-sm font-medium text-gray-500">Endereço</dt><dd class="mt-1 text-sm text-gray-900">${addressHTML}</dd></div>
                        ${customer.notes ? `<div class="sm:col-span-2"><dt class="text-sm font-medium text-gray-500">Observações</dt><dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${customer.notes}</dd></div>` : ''}
                    </dl>
                `;
    } catch (error) {
        contentDiv.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
    }
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}
