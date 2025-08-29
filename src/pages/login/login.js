const apiUrl = import.meta.env.VITE_API_URL;

// --- DOM ELEMENTS ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
const loginButton = document.getElementById('login-button');
const buttonText = document.getElementById('button-text');
const buttonLoading = document.getElementById('button-loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const signupLink = document.getElementById('signup-link');

// Elementos do Modal "Esqueci minha senha"
const forgotPasswordLink = document.getElementById('forgot-password-link'); // ID CORRIGIDO
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const resetPasswordForm = document.getElementById('reset-password-form');
const resetEmailInput = document.getElementById('reset-email');
const closeModal = document.getElementById('close-modal');
const cancelReset = document.getElementById('cancel-reset');

// --- FUNÇÕES DE FEEDBACK ---
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg';
    toast.style.transition = 'opacity 0.5s, transform 0.5s';
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 100);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// --- LÓGICA DE UI ---
togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('svg').classList.toggle('text-gray-700');
});


// --- LÓGICA DE LOGIN ---
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Por favor, preencha o e-mail e a senha.');
        return;
    }

    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    loginButton.disabled = true;

    const payload = { username: email, password: password };

    fetch(`${apiUrl}/api/accounts/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async response => {
        if (!response.ok) {
            // Tenta extrair uma mensagem de erro do backend
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Credenciais inválidas.');
        }
        
        window.location.href = '../../../index.html'; 
    })
    .catch(error => {
        showError(error.message);
    })
    .finally(() => {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        loginButton.disabled = false;
    });
});


// --- LÓGICA DO MODAL ESQUECI MINHA SENHA ---
function closeForgotPasswordModal() {
    forgotPasswordModal.classList.add('hidden');
}

forgotPasswordLink.addEventListener('click', function (e) {
    e.preventDefault();
    forgotPasswordModal.classList.remove('hidden');
});

closeModal.addEventListener('click', closeForgotPasswordModal);
cancelReset.addEventListener('click', closeForgotPasswordModal);

resetPasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = resetEmailInput.value.trim();
    const forgotPasswordButton = this.querySelector('button[type="submit"]');
    if (!email) {
        alert('Por favor, digite seu e-mail.');
        return;
    }
    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = 'Enviando...';
    fetch(`${apiUrl}/api/accounts/password_reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
        .then(async response => {
            if (!response.ok) throw new Error('Não foi possível encontrar um usuário com este e-mail.');
            return response.json();
        })
        .then(data => {
            closeForgotPasswordModal();
            showSuccessToast('E-mail de redefinição enviado! Verifique o console do Django.');
        })
        .catch(error => { alert(error.message); })
        .finally(() => {
            forgotPasswordButton.disabled = false;
            forgotPasswordButton.textContent = 'Enviar';
        });
});

// --- NAVEGAÇÃO EXTRA ---
signupLink.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = 'cadastros/admin/cadastroAdmin.html';
});