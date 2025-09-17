const apiUrl = import.meta.env.VITE_API_URL;

const resetForm = document.getElementById('reset-form');
const tokenInput = document.getElementById('token-input');
const messageArea = document.getElementById('message-area');
const submitButton = document.getElementById('submit-button');
const newPasswordInput = document.getElementById('new-password');

const strengthBar = document.getElementById('password-strength-bar');
const strengthText = document.getElementById('password-strength-text');

function checkAndUpdatePasswordStrength(password, bar, text) {
    const value = password.value;
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    bar.className = 'h-1 rounded-full transition-all duration-300';
    text.textContent = '';
    text.className = 'text-xs';

    if (value.length === 0) return;

    switch (score) {
        case 0: case 1: case 2:
            bar.classList.add('bg-red-500', 'w-1/4');
            text.textContent = 'Senha fraca';
            text.classList.add('text-red-500');
            break;
        case 3:
            bar.classList.add('bg-yellow-500', 'w-1/2');
            text.textContent = 'Senha média';
            text.classList.add('text-yellow-500');
            break;
        case 4: case 5:
            bar.classList.add('bg-blue-500', 'w-3/4');
            text.textContent = 'Senha boa';
            text.classList.add('text-blue-500');
            break;
        case 6:
            bar.classList.add('bg-green-500', 'w-full');
            text.textContent = 'Senha forte';
            text.classList.add('text-green-500');
            break;
    }
}

newPasswordInput.addEventListener('input', () => {
    checkAndUpdatePasswordStrength(newPasswordInput, strengthBar, strengthText);
});

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
        tokenInput.value = token;
    } else {
        showMessage('Token de redefinição inválido ou ausente.', 'error');
        resetForm.classList.add('hidden');
    }
});


function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = `p-4 mb-4 rounded ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    messageArea.classList.remove('hidden');
}

resetForm.addEventListener('submit', function (e) {
    e.preventDefault(); 
    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";

    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const token = tokenInput.value;

    // Validações do frontend
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = "Salvar Nova Senha";
        return;
    }
    if (password.length < 8) {
        showMessage('A senha deve ter pelo menos 8 caracteres.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = "Salvar Nova Senha";
        return;
    }

    const payload = {
        token: token,
        password: password
    };

    // Envia os dados para a API
    fetch(`${apiUrl}/api/accounts/password_reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                let errorMsg = "Ocorreu um erro. ";
                if (data.password) errorMsg += `Senha: ${data.password.join(' ')}. `;
                if (data.token) errorMsg += `Token: ${data.token.join(' ')}. `;
                if (data.status) errorMsg += data.status;
                throw new Error(errorMsg.trim());
            }
            return data;
        })
        .then(data => {
            resetForm.classList.add('hidden');
            showMessage('Senha redefinida com sucesso! Você já pode fazer o login com sua nova senha.', 'success');
        })
        .catch(error => {
            showMessage(error.message, 'error');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = "Salvar Nova Senha";
        });
});