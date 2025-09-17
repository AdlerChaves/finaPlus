const apiUrl = import.meta.env.VITE_API_URL;

const registrationForm = document.getElementById('registration-form');
const companySection = document.getElementById('company-section');
const adminSection = document.getElementById('admin-section');
const nextToAdminBtn = document.getElementById('next-to-admin');
const backToCompanyBtn = document.getElementById('back-to-company');
const registerButton = document.getElementById('register-button');
const buttonText = document.getElementById('button-text');
const buttonLoading = document.getElementById('button-loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const successModal = document.getElementById('success-modal');
const countdownElement = document.getElementById('countdown');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const togglePassword = document.getElementById('toggle-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
const passwordMatch = document.getElementById('password-match');
const passwordMismatch = document.getElementById('password-mismatch');
const cnpjInput = document.getElementById('cnpj');
const passwordStrengthBar = document.getElementById('password-strength');
const passwordStrengthText = document.getElementById('password-strength-text');
const phoneInput = document.getElementById('phone');

// --- LÓGICA DA INTERFACE ---

if (cnpjInput) {
    IMask(cnpjInput, { mask: '00.000.000/0000-00' });
}

if (phoneInput) {
    IMask(phoneInput, { mask: '(00) 00000-0000' });
}

function setupPasswordToggle(inputElement, toggleButton) {
    toggleButton.addEventListener('click', function () {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        this.querySelector('svg').classList.toggle('text-gray-700');
    });
}
setupPasswordToggle(passwordInput, togglePassword);
setupPasswordToggle(confirmPasswordInput, toggleConfirmPassword);

function checkPasswordMatch() {
    if (passwordInput.value && confirmPasswordInput.value) {
        if (passwordInput.value === confirmPasswordInput.value) {
            passwordMatch.classList.remove('hidden');
            passwordMismatch.classList.add('hidden');
            return true;
        } else {
            passwordMatch.classList.add('hidden');
            passwordMismatch.classList.remove('hidden');
            return false;
        }
    }
    return false;
}

function checkAndUpdatePasswordStrength() {
    const value = passwordInput.value;
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    passwordStrengthBar.classList.remove('weak', 'fair', 'good', 'strong');
    passwordStrengthText.classList.remove('text-red-500', 'text-yellow-500', 'text-blue-500', 'text-green-500');

    if (value.length === 0) {
        passwordStrengthText.textContent = '';
        return;
    }

    switch (score) {
        case 0: case 1: case 2:
            passwordStrengthBar.classList.add('weak');
            passwordStrengthText.textContent = 'Senha fraca';
            passwordStrengthText.classList.add('text-red-500');
            break;
        case 3:
            passwordStrengthBar.classList.add('fair');
            passwordStrengthText.textContent = 'Senha média';
            passwordStrengthText.classList.add('text-yellow-500');
            break;
        case 4: case 5:
            passwordStrengthBar.classList.add('good');
            passwordStrengthText.textContent = 'Senha boa';
            passwordStrengthText.classList.add('text-blue-500');
            break;
        case 6:
            passwordStrengthBar.classList.add('strong');
            passwordStrengthText.textContent = 'Senha forte';
            passwordStrengthText.classList.add('text-green-500');
            break;
    }
}

passwordInput.addEventListener('input', () => {
    checkPasswordMatch();
    checkAndUpdatePasswordStrength();
});
confirmPasswordInput.addEventListener('input', checkPasswordMatch);

// --- NAVEGAÇÃO DO FORMULÁRIO ---
nextToAdminBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const companyName = document.getElementById('company-name').value.trim();
    if (!companyName) {
        showError('Por favor, informe o nome da empresa.');
        return;
    }
    companySection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    updateProgressSteps(2);
});

backToCompanyBtn.addEventListener('click', function (e) {
    e.preventDefault();
    adminSection.classList.add('hidden');
    companySection.classList.remove('hidden');
    updateProgressSteps(1);
});

function updateProgressSteps(step) { /* ...código existente... */ }

// --- FUNÇÕES DE FEEDBACK ---
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// Nova função helper para "desempacotar" os erros
function parseErrors(errorData) {
    let errorMessage = "";
    for (const field in errorData) {
        const value = errorData[field];
        if (typeof value === 'object' && !Array.isArray(value)) {
            // É um erro aninhado, como em 'company'. Vamos olhar dentro dele.
            for (const nestedField in value) {
                errorMessage += `${nestedField}: ${value[nestedField].join(', ')} `;
            }
        } else {
            // É um erro de nível superior, como 'email' ou 'password'.
            errorMessage += `${field}: ${value.join(', ')} `;
        }
    }
    return errorMessage;
}

registrationForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!checkPasswordMatch()) {
        showError('As senhas não coincidem.');
        return;
    }

    // Coleta dos dados dos campos
    const companyName = document.getElementById('company-name').value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();
    const businessArea = document.getElementById('business-area').value;
    const firstName = document.getElementById('first-name').value.trim(); // NOVO
    const lastName = document.getElementById('last-name').value.trim(); // NOVO
    const phone = document.getElementById('phone').value.replace(/\D/g, ''); // NOVO (remove máscara)
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Montagem do payload para a API
    const payload = {
        email: email,
        password: password,
        first_name: firstName, // NOVO
        last_name: lastName,   // NOVO
        phone: `+55${phone}`,     // NOVO (adiciona código do país)
        company: { name: companyName, cnpj: cnpj, business_area: businessArea }
    };


    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    registerButton.disabled = true;

    try {
        const response = await fetch(`${apiUrl}/api/accounts/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Usa nossa nova função para extrair a mensagem de erro
            const readableError = parseErrors(data);
            throw new Error(`Ocorreu um erro. ${readableError}`);
        }

        // Sucesso
        successModal.classList.remove('hidden');
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = '../../login/login.html';
            }
        }, 1000);

    } catch (error) {
        showError(error.message);
        console.error('Fetch error:', error);
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        registerButton.disabled = false;
    }
}); 