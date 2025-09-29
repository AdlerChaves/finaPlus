const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../componentes/auth.js";
import { renderTopbar } from "../../componentes/topBar/topBar.js";

// Função para buscar os dados do usuário e popular a página
function loadUserSettings() {
    fetch(`${apiUrl}/api/accounts/me/`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    })
        .then(response => {
            if (!response.ok) throw new Error('Falha ao carregar dados do usuário.');
            return response.json();
        })
        .then(data => {
            document.getElementById('first-name').value = data.first_name || '';
            document.getElementById('last-name').value = data.last_name || '';
            document.getElementById('user-email').value = data.email || '';

            let phoneToDisplay = data.phone || '';
            if (phoneToDisplay.startsWith('+55')) {
                phoneToDisplay = phoneToDisplay.substring(3);
            }

            const phoneInput = document.getElementById('user-phone');
            phoneInput.value = phoneToDisplay;

            if (typeof IMask !== 'undefined') {
                IMask(phoneInput, { mask: '(00) 00000-0000' });
            }

        })
        .catch(error => console.error('Erro ao carregar configurações:', error));
}


// --- PONTO DE ENTRADA PRINCIPAL DO SCRIPT ---
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData'));

    // Funções de inicialização da página
    protectPage('configuracoes');
    renderTopbar('configuracoes', userData.permissions_list);
    loadUserSettings();

    // --- OUVINTES DE EVENTOS (EVENT LISTENERS) ---

    // 1. Salvar Alterações
    document.getElementById('save-settings').addEventListener('click', function () {
        const phoneValue = document.getElementById('user-phone').value.replace(/\D/g, '');
        const payload = {
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            phone: phoneValue ? `+55${phoneValue}` : '',
            theme: document.getElementById('theme-toggle').checked ? 'dark' : 'light',
            currency: document.getElementById('currency').value,
            language: document.getElementById('language').value,
        };

        fetch(`${apiUrl}/api/accounts/me/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.ok) {
                    const toast = document.getElementById('toast-notification');
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 3000);
                } else {
                    response.json().then(data => {
                        console.error('Erro do servidor:', data);
                        alert('Falha ao salvar. Verifique os dados e tente novamente.');
                    });
                }
            })
            .catch(error => {
                console.error('Erro de rede ou de script:', error);
                alert('Não foi possível salvar as configurações. Verifique a sua conexão.');
            });
    });

    // 2. Encerrar Sessão (Logout)
    document.getElementById('logout').addEventListener('click', function () {
        if (confirm('Tem certeza que deseja sair da sua conta?')) {
            fetch(`${apiUrl}/api/accounts/logout/`, {
                method: 'POST',
                credentials: 'include'
            })
                .then(response => {
                    // Independentemente da resposta do servidor, força o logout no cliente
                    console.log('Logout solicitado.');
                    localStorage.clear();
                    window.location.href = "/src/pages/login/login.html";
                })
                .catch(error => {
                    console.error('Erro no logout:', error);
                    alert('Não foi possível fazer logout. Verifique sua conexão.');
                    localStorage.clear();
                    window.location.href = "/src/pages/login/login.html";
                });
        }
    });

    // 3. Lógica do Modal de Exclusão de Conta
    document.getElementById('delete-account').addEventListener('click', function () {
        document.getElementById('delete-modal').classList.remove('hidden');
    });

    document.getElementById('cancel-delete').addEventListener('click', function () {
        document.getElementById('delete-modal').classList.add('hidden');
    });

    document.getElementById('confirm-delete').addEventListener('click', function () {
        fetch(`${apiUrl}/api/accounts/delete-account/`, {
            method: 'DELETE',
            credentials: 'include' // CORRIGIDO: Usa cookies para autenticação
        })
            .then(response => {
                if (response.ok || response.status === 204) {
                    alert('Conta excluída com sucesso!');
                    localStorage.clear();
                    window.location.href = "/src/pages/login/login.html";
                } else {
                    throw new Error('Falha ao excluir a conta.');
                }
            })
            .catch(error => {
                console.error('Erro ao excluir conta:', error);
                alert('Não foi possível excluir a conta. Tente novamente.');
            });
    });

    // 4. Lógica do Modal de Alteração de Senha
    const changePasswordBtn = document.getElementById('change-password');
    // Verifica se o botão existe antes de adicionar o listener
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function () {
            document.getElementById('password-modal').classList.remove('hidden');
        });
    }

    document.getElementById('close-password-modal').addEventListener('click', function () {
        document.getElementById('password-modal').classList.add('hidden');
    });

    document.getElementById('update-password').addEventListener('click', function () {
        const payload = {
            current_password: document.getElementById('current-password').value,
            new_password: document.getElementById('new-password').value
        };

        if (payload.new_password !== document.getElementById('confirm-password').value) {
            alert('A nova senha e a confirmação não coincidem!');
            return;
        }

        fetch(`${apiUrl}/api/accounts/change-password/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // CORRIGIDO: Usa cookies para autenticação
            body: JSON.stringify(payload)
        })
            .then(async response => {
                if (response.ok) {
                    alert('Senha alterada com sucesso!');
                    document.getElementById('password-modal').classList.add('hidden');
                } else {
                    const errorData = await response.json();
                    const errorMessage = Object.values(errorData).flat().join('\n');
                    throw new Error(errorMessage);
                }
            })
            .catch(error => {
                console.error('Erro ao alterar senha:', error);
                alert(`Erro: ${error.message}`);
            });
    });

    // 5. Carregar Preferências Salvas
    const savedTheme = localStorage.getItem('financaplus-theme');
    const savedCurrency = localStorage.getItem('financaplus-currency');
    const savedLanguage = localStorage.getItem('financaplus-language');

    if (savedTheme === 'dark') {
        document.getElementById('theme-toggle').checked = true;
        document.body.classList.add('bg-gray-900', 'text-white');
    }
    if (savedCurrency) {
        document.getElementById('currency').value = savedCurrency;
    }
    if (savedLanguage) {
        document.getElementById('language').value = savedLanguage;
    }
});