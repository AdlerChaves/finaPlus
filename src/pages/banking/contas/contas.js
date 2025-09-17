const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('contas');
    renderTopbar('pagamentos', userData.permissions_list);
    renderAccounts();
});
// --- DOM ELEMENTS ---
const accountModal = document.getElementById('account-modal');
const deleteModal = document.getElementById('delete-modal');
const addAccountBtn = document.getElementById('add-account-btn');
const saveAccountBtn = document.getElementById('save-account-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const accountsTableBody = document.getElementById('accounts-table-body');
const mobileAccountsList = document.getElementById('mobile-accounts-list');
const accountForm = document.getElementById('account-form');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Variável para guardar o ID da conta a ser deletada
let accountIdToDelete = null;

// --- FUNÇÕES DE RENDERIZAÇÃO ---

// Formata um número para o padrão de moeda BRL
function formatMoney(value) {
    // Converte a string para número, caso venha do backend como texto
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) {
        return "R$ 0,00";
    }
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função principal que busca e renderiza as contas
// Dentro da tag <script> do seu contas.html

async function renderAccounts() {

    const cardsButton = document.getElementById('cards-button');
    let cardsButtonListener = null;

    try {
        const response = await fetch(`${apiUrl}/api/finance/bank-accounts/`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = './login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Falha ao buscar contas. Faça login novamente.');
        }

        const accounts = await response.json();

        // Limpa a tabela e a lista móvel
        accountsTableBody.innerHTML = '';
        mobileAccountsList.innerHTML = '';

        // --- LÓGICA DO BOTÃO "CARTÕES" ---
        if (accounts.length === 0) {
            accountsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhuma conta cadastrada.</td></tr>`;

            // Desabilita o botão "Cartões"
            cardsButton.classList.add('opacity-50', 'cursor-not-allowed');
            cardsButton.href = '#';
            cardsButtonListener = (e) => {
                e.preventDefault();
                alert("Você precisa cadastrar ao menos uma conta bancária para cadastrar cartões.");
            };
            cardsButton.addEventListener('click', cardsButtonListener);

            // Zera os resumos
            document.getElementById('total-balance-summary').textContent = formatMoney(0);
            document.getElementById('active-accounts-summary').textContent = 0;
            document.getElementById('inactive-accounts-summary').textContent = 0;
            return; // Encerra a função aqui se não houver contas

        } else {
            // Garante que o botão esteja ativo se houver contas
            cardsButton.classList.remove('opacity-50', 'cursor-not-allowed');
            cardsButton.href = '/src/pages/cadastros/cartoes/cadastroCartoes.html';
            if (cardsButtonListener) {
                cardsButton.removeEventListener('click', cardsButtonListener);
            }
        }

        // --- CÓDIGO DE RENDERIZAÇÃO E CÁLCULO (RESTAURADO) ---
        let totalBalance = 0;
        let activeAccounts = 0;
        let inactiveAccounts = 0;

        accounts.forEach(account => {
            if (account.is_active) {
                totalBalance += parseFloat(account.initial_balance);
                activeAccounts++;
            } else {
                inactiveAccounts++;
            }

            // Cria e adiciona a linha da tabela para Desktop
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${account.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${account.type}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatMoney(account.initial_balance)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${account.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="openEditModal(${account.id})" class="text-primary hover:text-primary-dark mr-3"><i class="fas fa-edit"></i></button>
                    <button onclick="openDeleteModal(${account.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            accountsTableBody.appendChild(row);

            // Cria e adiciona o card para Mobile
            const card = document.createElement('div');
            card.className = 'p-4 border-b';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-gray-900">${account.name}</p>
                        <p class="text-xs text-gray-500 mt-1">${account.type} • ${formatMoney(account.initial_balance)}</p>
                    </div>
                    <div class="text-right">
                         <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${account.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                    </div>
                </div>
                 <div class="mt-2 text-right">
                    <button onclick="openEditModal(${account.id})" class="text-primary hover:text-primary-dark mr-3"><i class="fas fa-edit"></i> Editar</button>
                    <button onclick="openDeleteModal(${account.id})" class="text-danger hover:text-red-700"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            `;
            mobileAccountsList.appendChild(card);
        });

        // Atualiza os cards de resumo
        document.getElementById('total-balance-summary').textContent = formatMoney(totalBalance);
        document.getElementById('active-accounts-summary').textContent = activeAccounts;
        document.getElementById('inactive-accounts-summary').textContent = inactiveAccounts;

    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message, 'error');
    }
}

// --- LÓGICA DO MODAL E CRUD ---

function openAddModal() {
    accountForm.reset();
    document.getElementById('modal-title').textContent = 'Adicionar Nova Conta';
    document.getElementById('account-id').value = '';
    document.getElementById('status-active').checked = true;
    accountModal.classList.remove('hidden');
}

async function openEditModal(id) {

    const response = await fetch(`${apiUrl}/api/finance/bank-accounts/${id}/`, {
        credentials: 'include'
    });
    if (response.status === 401) { window.location.href = './login.html'; return; }
    if (!response.ok) throw new Error('Falha ao buscar dados da conta.');

    const account = await response.json();

    document.getElementById('modal-title').textContent = 'Editar Conta';
    document.getElementById('account-id').value = account.id;
    document.getElementById('account-name').value = account.name;
    document.getElementById('account-type').value = account.type;
    document.getElementById('account-balance').value = account.initial_balance;
    document.getElementById(account.is_active ? 'status-active' : 'status-inactive').checked = true;
    document.getElementById('account-notes').value = account.notes;
    accountModal.classList.remove('hidden');
}

function closeModal() {
    accountModal.classList.add('hidden');
}

async function saveAccount() {

    const id = document.getElementById('account-id').value;
    const name = document.getElementById('account-name').value;
    const type = document.getElementById('account-type').value;
    const initial_balance = document.getElementById('account-balance').value;
    const is_active = document.getElementById('status-active').checked;
    const notes = document.getElementById('account-notes').value;

    const url = id ? `${apiUrl}/api/finance/bank-accounts/${id}/` : `${apiUrl}/api/finance/bank-accounts/`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, type, initial_balance, is_active, notes })
    });

    if (response.ok) {
        showToast(id ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!', 'success');
        closeModal();
        renderAccounts();
    } else {
        const errorData = await response.json();
        console.error("Erro ao salvar:", errorData);
        showToast('Ocorreu um erro ao salvar a conta.', 'error');
    }
}

function openDeleteModal(id) {
    accountIdToDelete = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    accountIdToDelete = null;
    deleteModal.classList.add('hidden');
}

async function deleteAccount() {
    if (!accountIdToDelete) return;

    try {
        const response = await fetch(`${apiUrl}/api/finance/bank-accounts/${accountIdToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status !== 204) {
            // ...lê o corpo da resposta para pegar a mensagem de erro específica.
            const errorData = await response.json();
            // Lança um erro com a mensagem do backend (ex: "Esta conta não pode ser excluída...")
            throw new Error(errorData.detail || 'Ocorreu um erro desconhecido.');
        }

        // Se a exclusão foi bem-sucedida (status 204)
        showToast('Conta excluída com sucesso!', 'success');
        closeDeleteModal();
        renderAccounts(); // Atualiza a lista na tela

    } catch (error) {
        // Agora o toast de erro exibirá a mensagem correta vinda da API
        showToast(error.message, 'error');
        // Também é bom fechar o modal de confirmação em caso de erro
        closeDeleteModal();
    }
}

// --- FUNÇÕES DE FEEDBACK E EVENT LISTENERS ---

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `fixed bottom-4 right-4 text-white px-4 py-2 rounded-md shadow-lg toast ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    setTimeout(() => { toast.className = 'hidden'; }, 3000);
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

// Event listeners para os botões
addAccountBtn.addEventListener('click', openAddModal);
saveAccountBtn.addEventListener('click', saveAccount);
cancelModalBtn.addEventListener('click', closeModal);
confirmDeleteBtn.addEventListener('click', deleteAccount);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
