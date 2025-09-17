const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
    fetchUsers();
});


const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');

    toastMessage.textContent = message;
    toast.className = 'fixed bottom-4 right-4 toast flex items-center text-white px-4 py-2 rounded-lg shadow-lg'; // Reset classes

    if (type === 'error') {
        toast.classList.add('bg-red-500');
        toastIcon.className = 'fas fa-times-circle mr-2';
    } else {
        toast.classList.add('bg-green-500');
        toastIcon.className = 'fas fa-check-circle mr-2';
    }

    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
};

// --- RENDERIZAÇÃO E DOM ---
const renderUsersTable = (users) => {
    const tableBody = document.querySelector('tbody');
    // ADICIONADO: Seleciona o container dos cards mobile
    const mobileContainer = document.querySelector('.md\\:hidden.divide-y');

    // Limpa ambos os containers
    tableBody.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '';

    if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum usuário encontrado.</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = `<p class="p-4 text-center text-gray-500">Nenhum usuário encontrado.</p>`;
        return;
    }

    users.forEach(user => {
        const permissionsHtml = (user.permissions_list || []).map(p => `<span class="permission-badge">${p}</span>`).join('');
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const initials = `${(user.first_name || ' ')[0]}${(user.last_name || ' ')[0]}`.trim().toUpperCase();
        const statusClass = user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const statusText = user.is_active ? 'Ativo' : 'Inativo';

        // --- 1. Lógica para a Tabela (Desktop) ---
        const row = `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="avatar w-10 h-10 bg-blue-500 mr-3"><span>${initials}</span></div>
                                <div><div class="text-sm font-medium text-gray-900">${fullName}</div></div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role}</td>
                        <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span></td>
                        <td class="px-6 py-4"><div class="flex flex-wrap max-w-xs">${permissionsHtml}</div></td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-blue-500 hover:text-blue-700 mr-3 edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                            <button class="text-red-500 hover:text-red-700 delete-user" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>`;
        tableBody.innerHTML += row;

        // --- 2. Lógica para os Cards (Mobile) ADICIONADA ---
        if (mobileContainer) {
            const card = `
                        <div class="p-4">
                            <div class="flex justify-between items-start">
                                <div class="flex items-center">
                                    <div class="avatar w-10 h-10 bg-blue-500 mr-3"><span>${initials}</span></div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">${fullName}</p>
                                        <p class="text-xs text-gray-500">${user.email}</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span>
                            </div>
                            <div class="mt-3">
                                <p class="text-xs text-gray-500"><i class="fas fa-briefcase mr-1"></i> ${user.role || 'N/A'}</p>
                            </div>
                            <div class="mt-3 flex flex-wrap">${permissionsHtml}</div>
                            <div class="mt-3 flex justify-end space-x-3">
                                <button class="text-blue-500 hover:text-blue-700 edit-user" data-id="${user.id}"><i class="fas fa-edit"></i> Editar</button>
                                <button class="text-red-500 hover:text-red-700 delete-user" data-id="${user.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                            </div>
                        </div>`;
            mobileContainer.innerHTML += card;
        }
    });
};

const fetchUsers = async () => {
    try {
        const response = await fetch(`${apiUrl}/api/accounts/users/`, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.status === 401) { window.location.href = '../login.html'; return; }
        if (!response.ok) throw new Error('Falha ao buscar usuários.');

        const users = await response.json();
        if (users) renderUsersTable(users.results || users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showToast(error.message, 'error');
    }
};

const renderGroupPermissions = async (userGroups = []) => {
    const permissionsContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2'); // Container dos checkboxes
    permissionsContainer.innerHTML = 'Carregando grupos...'; // Feedback para o usuário

    try {
        const response = await fetch(`${apiUrl}/api/groups/`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao carregar grupos.');

        const allGroups = await response.json();
        permissionsContainer.innerHTML = ''; // Limpa a mensagem "Carregando..."

        allGroups.forEach(group => {
            // 2. VERIFICA SE O USUÁRIO PERTENCE A ESTE GRUPO
            const isChecked = userGroups.some(userGroup => userGroup.id === group.id);

            // 3. CRIA O CHECKBOX DINAMICAMENTE
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'flex items-center';
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="group-${group.id}" data-group-id="${group.id}" 
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       ${isChecked ? 'checked' : ''}>
                <label for="group-${group.id}" class="ml-2 block text-sm text-gray-700">${group.name}</label>
            `;
            permissionsContainer.appendChild(checkboxDiv);
        });

    } catch (error) {
        console.error(error);
        permissionsContainer.innerHTML = '<p class="text-red-500 text-xs">Não foi possível carregar as permissões.</p>';
    }
};


// --- MODAIS ---
const userModal = document.getElementById('user-modal');
const deleteModal = document.getElementById('delete-modal');
const userForm = document.getElementById('user-form');

const openUserModal = async (userId = null) => {
    userForm.reset();
    document.getElementById('user-id').value = '';
    document.getElementById('email').disabled = false;
    document.getElementById('password').required = true;

    if (userId) {
        document.getElementById('modal-title').textContent = 'Editar Usuário';
        document.getElementById('password').required = false;
        try {
            const response = await fetch(`${apiUrl}/api/accounts/users/${userId}/`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.status === 401) { window.location.href = '../login.html'; return; }
            if (!response.ok) throw new Error('Falha ao carregar dados do usuário.');

            const user = await response.json();

            await renderGroupPermissions(user.groups);

            if (!user) return;

            document.getElementById('user-id').value = user.id;
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            document.getElementById('full-name').value = fullName;
            document.getElementById('email').value = user.email;
            document.getElementById('email').disabled = true;
            document.getElementById('role').value = user.role;
            document.getElementById('status').checked = user.is_active;
            document.getElementById('status-label').textContent = user.is_active ? 'Ativo' : 'Inativo';

            // Marcar checkboxes de permissão
            document.querySelectorAll('input[id^="permission-"]').forEach(cb => cb.checked = false);
            (user.permissions_list || []).forEach(p => {
                const sanitizedPermission = p.toLowerCase().replace(/ /g, '-').replace(/ç/g, 'c').replace(/ã/g, 'a');
                const checkbox = document.getElementById(`permission-${sanitizedPermission}`);
                if (checkbox) checkbox.checked = true;
            });
            updatePermissionsSummary();
        } catch (error) { console.error("Erro ao carregar dados do usuário", error); }
    } else {
        document.getElementById('modal-title').textContent = 'Adicionar Novo Usuário';
        updatePermissionsSummary();
        await renderGroupPermissions();
    }
    userModal.classList.remove('modal-hidden');
};

const closeUserModal = () => userModal.classList.add('modal-hidden');

const openDeleteModal = (userId) => {
    document.getElementById('confirm-delete').dataset.id = userId;
    deleteModal.classList.remove('modal-hidden');
};

const closeDeleteModal = () => deleteModal.classList.add('modal-hidden');


// --- LÓGICA E EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {

    // Eventos do modal de usuário
    document.getElementById('add-user-button').addEventListener('click', () => openUserModal());
    document.getElementById('close-modal').addEventListener('click', closeUserModal);
    document.getElementById('cancel-button').addEventListener('click', closeUserModal);

    // Delegação de eventos na tabela
    document.querySelector('tbody').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-user');
        const deleteBtn = e.target.closest('.delete-user');
        if (editBtn) openUserModal(editBtn.dataset.id);
        if (deleteBtn) openDeleteModal(deleteBtn.dataset.id);
    });

    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-user');
        const deleteBtn = e.target.closest('.delete-user');
        if (editBtn) openUserModal(editBtn.dataset.id);
        if (deleteBtn) openDeleteModal(deleteBtn.dataset.id);
    });

    // Eventos do modal de exclusão
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', async function () {
        const userId = this.dataset.id;
        try {
            const response = await fetch(`${apiUrl}/api/accounts/users/${userId}/`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.status !== 204) throw new Error('Falha ao excluir usuário.');

            showToast('Usuário excluído com sucesso!');
            closeDeleteModal();
            fetchUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            showToast(error.message, 'error');
        }
    });


    // --- EVENTO DE SUBMISSÃO DO FORMULÁRIO CORRIGIDO E COMPLETO ---
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('user-id').value;
        let method = '';
        let endpoint = '';
        let bodyData = {};

        const selectedGroupIds = Array.from(document.querySelectorAll('input[id^="group-"]:checked'))
            .map(cb => parseInt(cb.dataset.groupId));
        const fullName = document.getElementById('full-name').value.split(' ');

        if (userId) {
            // --- MODO EDIÇÃO (CORRIGIDO) ---
            method = 'PATCH'; // Usamos PATCH para atualização parcial
            endpoint = `${apiUrl}/api/accounts/users/${userId}/`; // Endpoint de detalhe/atualização do usuário

            bodyData = {
                first_name: fullName.slice(0, 1).join(' ') || '',
                last_name: fullName.slice(1).join(' ').trim(),
                is_active: document.getElementById('status').checked,
                groups: selectedGroupIds
            };

            // Adiciona a senha ao corpo da requisição APENAS se o usuário digitou uma nova
            const password = document.getElementById('password').value;
            if (password) {
                if (password.length < 8) {
                    showToast('A nova senha deve ter pelo menos 8 caracteres.', 'error');
                    return;
                }
                bodyData.password = password;
            }

        } else {
            // --- MODO CRIAÇÃO (Já está correto) ---
            method = 'POST';
            endpoint = `${apiUrl}/api/accounts/users/`;
            bodyData = {
                first_name: fullName.slice(0, 1).join(' ') || '',
                last_name: fullName.slice(1).join(' ').trim(),
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                is_active: document.getElementById('status').checked,
                groups: selectedGroupIds
            };

            if (!bodyData.password || bodyData.password.length < 8) {
                showToast('A senha é obrigatória e deve ter pelo menos 8 caracteres.', 'error');
                return;
            }
        }

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = Object.values(errorData).flat().join(' \n');
                throw new Error(errorMessage || 'Ocorreu um erro desconhecido.');
            }

            const successMessage = userId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!';
            showToast(successMessage);
            closeUserModal();
            fetchUsers();

        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            showToast(error.message, 'error');
        }
    });

    // Lógica do UI do formulário
    document.getElementById('toggle-password').addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    document.getElementById('status').addEventListener('change', function () {
        document.getElementById('status-label').textContent = this.checked ? 'Ativo' : 'Inativo';
    });

    document.querySelectorAll('input[id^="permission-"]').forEach(checkbox => {
        checkbox.addEventListener('change', updatePermissionsSummary);
    });
});


// Função para atualizar o resumo das permissões
function updatePermissionsSummary() {
    const summaryContainer = document.getElementById('permissions-summary');
    const checkedPermissions = document.querySelectorAll('input[id^="permission-"]:checked');

    summaryContainer.innerHTML = checkedPermissions.length === 0
        ? '<span class="text-xs text-gray-500">Nenhuma permissão selecionada</span>'
        : '';

    checkedPermissions.forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`).textContent;
        const badge = document.createElement('span');
        badge.className = 'permission-badge';
        badge.textContent = label;
        summaryContainer.appendChild(badge);
    });
}