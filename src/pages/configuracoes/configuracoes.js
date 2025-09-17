const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../componentes/auth.js";
import { renderTopbar } from "../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('configuracoes');
    renderTopbar('configuracoes', userData.permissions_list);
    loadUserSettings();
});



document.addEventListener('DOMContentLoaded', () => {

});

// Função para buscar os dados do usuário e popular a página
function loadUserSettings() {
    fetch(`${apiUrl}/api/accounts/me/`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    })
        .then(response => response.json())
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

            // Aplica a máscara ao valor já sem o +55
            IMask(phoneInput, { mask: '(00) 00000-0000' });

            // Preferências do Sistema
            document.getElementById('theme-toggle').checked = data.theme === 'dark';
            document.getElementById('currency').value = data.currency;
            document.getElementById('language').value = data.language;

            // Notificações
            document.getElementById('weekly-goals-toggle').checked = data.notify_weekly_goals;
            document.getElementById('large-transactions-toggle').checked = data.notify_large_transactions;
            document.getElementById('bills-reminder-toggle').checked = data.notify_bills_reminder;
        })
        .catch(error => console.error('Erro ao carregar configurações:', error));
}

// Salvar alterações
document.getElementById('save-settings').addEventListener('click', function () {
    const phoneValue = document.getElementById('user-phone').value.replace(/\D/g, '');

    const payload = {
        first_name: document.getElementById('first-name').value,
        last_name: document.getElementById('last-name').value,
        phone: phoneValue ? `+55${phoneValue}` : '', // Envia com código do país
        theme: document.getElementById('theme-toggle').checked ? 'dark' : 'light',
        currency: document.getElementById('currency').value,
        language: document.getElementById('language').value,
        notify_weekly_goals: document.getElementById('weekly-goals-toggle').checked,
        notify_large_transactions: document.getElementById('large-transactions-toggle').checked,
        notify_bills_reminder: document.getElementById('bills-reminder-toggle').checked
    };

    // A correção está na estrutura do fetch abaixo
    fetch(`${apiUrl}/api/accounts/me/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',

        },
        credentials: 'include', // Garante que os cookies de autenticação são enviados
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (response.ok) {
                const toast = document.getElementById('toast-notification');
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 3000);
            } else {
                // Se houver um erro, tenta mostrar uma mensagem mais detalhada do backend
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

// Atualizar senha
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
        method: 'PUT', // ou PATCH dependendo da sua view
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
    })
        .then(async response => {
            if (response.ok) {
                alert('Senha alterada com sucesso!');
                document.getElementById('password-modal').classList.add('hidden');
            } else {
                const errorData = await response.json();
                const errorMessage = Object.values(errorData).join('\n');
                throw new Error(errorMessage);
            }
        })
        .catch(error => {
            console.error('Erro ao alterar senha:', error);
            alert(`Erro: ${error.message}`);
        });
});

// Excluir conta
document.getElementById('confirm-delete').addEventListener('click', function () {
    fetch(`${apiUrl}/api/accounts/delete-account/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getAccessToken()}`
        }
    })
        .then(response => {
            if (response.ok) {
                alert('Conta excluída com sucesso!');
                // Limpa os dados e redireciona
                localStorage.clear();
                window.location.href = "./login.html";
            } else {
                throw new Error('Falha ao excluir a conta.');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir conta:', error);
            alert('Não foi possível excluir a conta. Tente novamente.');
        });
});

// 2FA modal
document.getElementById('enable-2fa').addEventListener('click', function () {
    document.getElementById('twofa-modal').classList.remove('hidden');
});

document.getElementById('close-twofa-modal').addEventListener('click', function () {
    document.getElementById('twofa-modal').classList.add('hidden');
});

document.getElementById('enable-twofa').addEventListener('click', function () {
    const code = document.getElementById('twofa-code').value;

    if (!code || code.length !== 6) {
        alert('Por favor, insira um código de 6 dígitos válido');
        return;
    }

    alert('Verificação em duas etapas ativada com sucesso (simulação)');
    document.getElementById('twofa-modal').classList.add('hidden');
    document.getElementById('enable-2fa').innerHTML = '<i class="fas fa-shield-alt mr-2"></i> Configurado';
    document.getElementById('enable-2fa').classList.remove('bg-gray-100', 'text-gray-700');
    document.getElementById('enable-2fa').classList.add('bg-green-100', 'text-green-700');
});

// Export data
document.getElementById('export-data').addEventListener('click', function () {
    alert('Dados exportados com sucesso (simulação)');
});

// --- LÓGICA DE LOGOUT ATUALIZADA ---
document.getElementById('logout').addEventListener('click', function () {
    if (confirm('Tem certeza que deseja sair da sua conta?')) {
        // Faz uma chamada POST para a nova view de logout
        fetch(`${apiUrl}/api/accounts/logout/`, { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    // Limpa qualquer dado que ainda possa existir no localStorage (boa prática)
                    localStorage.clear();
                    // Redireciona para a página de login
                    window.location.href = "./login.html";
                } else {
                    throw new Error('Falha ao fazer logout.');
                }
            })
            .catch(error => {
                console.error('Erro no logout:', error);
                alert('Não foi possível fazer logout. Tente novamente.');
            });
    }
});



// Load saved preferences
document.addEventListener('DOMContentLoaded', function () {
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


