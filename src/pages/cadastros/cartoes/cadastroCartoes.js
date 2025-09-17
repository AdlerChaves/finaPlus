const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

let cardIdToModify = null;

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
    setupEventListeners();
    renderCreditCards();
});


const formatMoney = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return "R$ 0,00";
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Esta nova função irá carregar o HTML do modal E configurar os seus eventos
async function setupEventListeners() {
    try {

        document.getElementById('openModalBtn').addEventListener('click', openAddModal);
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        document.getElementById('creditCardForm').addEventListener('submit', saveCard);
        document.getElementById('confirm-delete-btn').addEventListener('click', deleteCard);
        document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);


    } catch (error) {
        console.error("Falha ao carregar o componente do modal:", error);
    }
}

// Função para renderizar os cartões na tabela
async function renderCreditCards() {

    const cardsTableBody = document.getElementById('cards-table-body');
    const activeCardsCountEl = document.getElementById('active-cards-count');
    const totalLimitEl = document.getElementById('total-limit');
    const nextDueDateEl = document.getElementById('next-due-date');

    try {
        const response = await fetch(`${apiUrl}/api/finance/credit-cards/`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Falha ao buscar os cartões de crédito. Tente fazer login novamente.');
        }

        const cards = await response.json();

        // 3. Limpa qualquer conteúdo antigo da tabela
        cardsTableBody.innerHTML = '';

        // 4. Se não houver cartões, exibe uma mensagem amigável e zera os resumos
        if (cards.length === 0) {
            cardsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Nenhum cartão cadastrado.</td></tr>`;
            activeCardsCountEl.textContent = 0;
            totalLimitEl.textContent = formatMoney(0);
            nextDueDateEl.textContent = '-';
            return;
        }

        // 5. Calcula os totais para os cards de resumo
        let activeCount = 0;
        let totalLimit = 0;
        cards.forEach(card => {
            if (card.is_active) {
                activeCount++;
                totalLimit += parseFloat(card.credit_limit);
            }
        });

        // Atualiza os cards de resumo no topo da página
        activeCardsCountEl.textContent = activeCount;
        totalLimitEl.textContent = formatMoney(totalLimit);
        const nextDueCard = cards.filter(c => c.is_active).sort((a, b) => a.due_day - b.due_day).find(c => c.due_day >= new Date().getDate()) || cards.find(c => c.is_active);
        if (nextDueCard) nextDueDateEl.textContent = `Dia ${nextDueCard.due_day}`;

        // 6. Cria uma linha na tabela para cada cartão retornado pela API
        cards.forEach(card => {
            const row = document.createElement('tr');
            // Adicionamos o botão de Editar com o onclick correto
            row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${card.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${card.brand}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">**** ${card.last_digits}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatMoney(card.credit_limit)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Todo dia ${card.due_day}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${card.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${card.is_active ? 'Ativo' : 'Inativo'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="openEditModal(${card.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                <i class="fas fa-edit"></i>
            </button>
              <button onclick="openDeleteModal(${card.id})" class="text-red-500 hover:text-red-700">
            <i class="fas fa-trash-alt"></i>
        </button>
            </td>
    `;
            cardsTableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Erro ao renderizar cartões:', error);
        alert(error.message); // Usando alert simples para o erro
    }
}

// Função para abrir o modal para Adicionar
function openAddModal() {
    const form = document.getElementById('creditCardForm');
    if (form) {
        form.reset();
        document.getElementById('modalTitle').textContent = 'Cadastrar Cartão';

        cardIdToModify = null;

        const cardIdInput = document.getElementById('cardId');
        if (cardIdInput) cardIdInput.value = '';

        populateAccountsDropdown();

        document.getElementById('creditCardModal').classList.remove('hidden');
    }
}
async function openEditModal(id) {
    cardIdToModify = id;

    try {
        const response = await fetch(`${apiUrl}/api/finance/credit-cards/${id}/`, {
            credentials: 'include'
        });
        if (response.status === 401) { window.location.href = '../login.html'; return; }
        if (!response.ok) throw new Error('Não foi possível carregar os dados do cartão.');

        const card = await response.json();

        await populateAccountsDropdown();

        const modal = document.getElementById('creditCardModal');
        document.getElementById('modalTitle').textContent = 'Editar Cartão de Crédito';
        document.getElementById('cardId').value = card.id;
        document.getElementById('cardName').value = card.name;
        document.getElementById('cardBrand').value = card.brand;
        document.getElementById('lastDigits').value = card.last_digits;
        document.getElementById('creditLimit').value = parseFloat(card.credit_limit).toFixed(2).replace('.', ',');
        document.getElementById('closingDay').value = card.closing_day;
        document.getElementById('dueDay').value = card.due_day;
        document.getElementById('associatedAccount').value = card.associated_account;
        document.getElementById('cardStatus').checked = card.is_active;

        // 4. Abre o modal
        modal.classList.remove('hidden');

    } catch (error) {
        alert(error.message); // Usando alert simples para feedback
    }
}

// Função para salvar (ainda vazia, será o Passo 2)
async function saveCard(event) {
    event.preventDefault();


    const id = cardIdToModify; // Pega o ID (pode ser nulo ou um número)

    const payload = {
        name: document.getElementById('cardName').value,
        brand: document.getElementById('cardBrand').value,
        last_digits: document.getElementById('lastDigits').value,
        credit_limit: document.getElementById('creditLimit').value.replace(/\./g, '').replace(',', '.'),
        closing_day: document.getElementById('closingDay').value,
        due_day: document.getElementById('dueDay').value,
        associated_account: document.getElementById('associatedAccount').value,
        is_active: document.getElementById('cardStatus').checked
    };

    const url = id ? `${apiUrl}/api/finance/credit-cards/${id}/` : `${apiUrl}/api/finance/credit-cards/`;
    const method = id ? 'PUT' : 'POST';

    const saveButton = document.querySelector('button[type="submit"][form="creditCardForm"]');
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
            let errorMsg = "Erro ao salvar: ";
            for (const field in errorData) {
                const message = Array.isArray(errorData[field]) ? errorData[field].join(', ') : errorData[field];
                errorMsg += `${field}: ${message} `;
            }
            throw new Error(errorMsg);
        }

        alert(id ? 'Cartão atualizado com sucesso!' : 'Cartão criado com sucesso!');
        closeModal();
        renderCreditCards();

    } catch (error) {
        alert(error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Salvar';
    }
}

async function deleteCard() {
    if (!cardIdToModify) return;

    try {
        const response = await fetch(`${apiUrl}/api/finance/credit-cards/${cardIdToModify}/`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status !== 204) { // 204 No Content é a resposta de sucesso para DELETE
            throw new Error('Erro ao excluir o cartão.');
        }

        alert('Cartão excluído com sucesso!');
        closeDeleteModal();
        renderCreditCards(); // Atualiza a lista na tela
    } catch (error) {
        alert(error.message);
    }
}

function closeModal() {
    const modal = document.getElementById('creditCardModal');
    if (modal) modal.classList.add('hidden');
}

function openDeleteModal(id) {
    cardIdToModify = id; // Guarda o ID do cartão a ser deletado
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    cardIdToModify = null; 
    document.getElementById('delete-modal').classList.add('hidden');
}


async function populateAccountsDropdown() {
    // Encontra o elemento <select> dentro do modal
    const associatedAccountSelect = document.getElementById('associatedAccount');
    if (!associatedAccountSelect) return; // Segurança caso o modal não tenha carregado

    try {
        const response = await fetch(`${apiUrl}/api/finance/bank-accounts/`, {
            credentials: 'include'
        });
        if (response.status === 401) { window.location.href = '../login.html'; return; }
        if (!response.ok) throw new Error('Falha ao carregar contas.');

        const accounts = await response.json();

        // 2. Limpa as opções existentes (exceto a primeira "Selecione")
        associatedAccountSelect.innerHTML = '<option value="">Selecione uma conta</option>';

        // 3. Adiciona uma nova <option> para cada conta ATIVA
        accounts
            .filter(account => account.is_active) // Filtra para pegar apenas contas ativas
            .forEach(account => {
                const option = document.createElement('option');
                option.value = account.id; // O valor será o ID da conta
                option.textContent = account.name; // O texto será o nome da conta
                associatedAccountSelect.appendChild(option);
            });

    } catch (error) {
        console.error("Erro ao popular contas:", error);
        associatedAccountSelect.innerHTML = '<option value="">Erro ao carregar contas</option>';
    }
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

