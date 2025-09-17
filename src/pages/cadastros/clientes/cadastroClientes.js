const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
});


document.addEventListener('DOMContentLoaded', function () {

    const customerId = new URLSearchParams(window.location.search).get('id');
    const form = document.getElementById('customerForm');

    // --- LÓGICA DE INICIALIZAÇÃO (CRIAR vs EDITAR) ---
    const initialize = () => {
        setupEventListeners();
        if (customerId) {
            prepareEditMode(customerId);
        } else {
            prepareCreateMode();
        }
    };

    const prepareCreateMode = () => {
        document.getElementById('page-title').textContent = 'Cadastro de Clientes';
        document.getElementById('page-subtitle').textContent = 'Preencha os dados do novo cliente';
    };

    const prepareEditMode = async (id) => {
        document.getElementById('page-title').textContent = 'Editar Cliente';
        document.getElementById('page-subtitle').textContent = 'Altere os dados do cliente abaixo';
        document.getElementById('saveButton').innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';

        try {
            const response = await fetch(`${apiUrl}/api/cadastros/customers/${id}/`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Não foi possível carregar os dados do cliente.');
            const customer = await response.json();
            populateForm(customer);
        } catch (error) {
            showToast(error.message, 'error');
            setTimeout(() => window.location.href = 'clientes.html', 2000);
        }
    };

    const populateForm = (customer) => {
        document.getElementById('customerId').value = customer.id;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerType').value = customer.customer_type;
        document.getElementById('customerDocument').value = customer.document;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerEmail').value = customer.email;
        document.getElementById('customerStatus').value = customer.status;
        document.getElementById('customerBirthDate').value = customer.birth_date || '';
        document.getElementById('customerNotes').value = customer.notes || '';

        if (customer.address) {
            document.getElementById('customerCEP').value = customer.address.cep || '';
            document.getElementById('customerStreet').value = customer.address.street || '';
            document.getElementById('customerNumber').value = customer.address.number || '';
            document.getElementById('customerComplement').value = customer.address.complement || '';
            document.getElementById('customerNeighborhood').value = customer.address.neighborhood || '';
            document.getElementById('customerCity').value = customer.address.city || '';
            document.getElementById('customerState').value = customer.address.state || '';
            document.getElementById('customerCountry').value = customer.address.country || 'Brasil';
        }
        // Dispara o evento 'change' para ajustar a UI (CPF/CNPJ)
        document.getElementById('customerType').dispatchEvent(new Event('change'));
    };

    // --- LÓGICA DE EVENTOS ---
    const setupEventListeners = () => {
        // Navegação por abas
        const infoTab = document.getElementById('infoTab');
        const addressTab = document.getElementById('addressTab');
        const nextTabBtn = document.getElementById('nextTab');
        const prevTabBtn = document.getElementById('previousTab');

        infoTab.addEventListener('click', () => switchTab('info'));
        addressTab.addEventListener('click', () => switchTab('address'));
        nextTabBtn.addEventListener('click', () => {
            if (validateBasicInfo()) switchTab('address');
        });
        prevTabBtn.addEventListener('click', () => switchTab('info'));

        // Mudança de tipo de cliente (PF/PJ)
        document.getElementById('customerType').addEventListener('change', handleCustomerTypeChange);

        // Busca por CEP
        document.getElementById('searchCEP').addEventListener('click', searchCEP);

        // Submissão do formulário
        form.addEventListener('submit', handleFormSubmit);
    };

    const switchTab = (tabName) => {
        const isInfo = tabName === 'info';
        document.getElementById('infoTab').classList.toggle('active', isInfo);
        document.getElementById('addressTab').classList.toggle('active', !isInfo);
        document.getElementById('infoContent').classList.toggle('hidden', !isInfo);
        document.getElementById('addressContent').classList.toggle('hidden', isInfo);
        document.getElementById('previousTab').classList.toggle('hidden', isInfo);
        document.getElementById('nextTab').classList.toggle('hidden', !isInfo);
    };

    const handleCustomerTypeChange = (e) => {
        const isPJ = e.target.value === 'PJ';
        document.getElementById('documentLabel').textContent = isPJ ? 'CNPJ*' : 'CPF*';
        document.getElementById('birthDateField').classList.toggle('hidden', isPJ);
    };

    const searchCEP = async () => {
        const cep = document.getElementById('customerCEP').value.replace(/\D/g, '');
        if (cep.length !== 8) return showToast('CEP inválido.', 'error');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok || response.erro) throw new Error();
            const data = await response.json();
            populateAddressFields(data);
        } catch {
            showToast('CEP não encontrado.', 'error');
        }
    };

    const populateAddressFields = (data) => {
        document.getElementById('customerStreet').value = data.logradouro;
        document.getElementById('customerNeighborhood').value = data.bairro;
        document.getElementById('customerCity').value = data.localidade;
        document.getElementById('customerState').value = data.uf;
    };

    // --- SUBMISSÃO E VALIDAÇÃO ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateBasicInfo()) {
            switchTab('info');
            return;
        }

        const id = document.getElementById('customerId').value;
        const url = id ? `${apiUrl}/api/cadastros/customers/${id}/` : `${apiUrl}/api/cadastros/customers/`;
        const method = id ? 'PUT' : 'POST';

        const payload = {
            name: document.getElementById('customerName').value,
            customer_type: document.getElementById('customerType').value,
            document: document.getElementById('customerDocument').value,
            phone: document.getElementById('customerPhone').value,
            email: document.getElementById('customerEmail').value,
            birth_date: document.getElementById('customerBirthDate').value || null,
            status: document.getElementById('customerStatus').value,
            notes: document.getElementById('customerNotes').value,
            address: null
        };

        const cep = document.getElementById('customerCEP').value;
        if (cep) {
            payload.address = {
                cep: cep,
                street: document.getElementById('customerStreet').value,
                number: document.getElementById('customerNumber').value,
                complement: document.getElementById('customerComplement').value,
                neighborhood: document.getElementById('customerNeighborhood').value,
                city: document.getElementById('customerCity').value,
                state: document.getElementById('customerState').value,
                country: document.getElementById('customerCountry').value
            };
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Necessário para enviar os cookies
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${value.join(', ')}`).join('; ');
                throw new Error(errorMessage || 'Erro ao salvar os dados.');
            }
            showToast('Cliente salvo com sucesso!', 'success');
            setTimeout(() => window.location.href = 'clientes.html', 1500);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const validateBasicInfo = () => {
        const required = ['customerName', 'customerType', 'customerDocument', 'customerPhone', 'customerEmail', 'customerStatus'];
        for (const id of required) {
            if (!document.getElementById(id).value) {
                showToast(`O campo "${document.getElementById(id).previousElementSibling.textContent}" é obrigatório.`, 'error');
                return false;
            }
        }
        return true;
    };

    // Inicia a aplicação
    initialize();
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toast.className = `fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}