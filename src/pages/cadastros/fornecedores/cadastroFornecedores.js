const apiUrl = import.meta.env.VITE_API_URL;

import { protectPage } from "../../../componentes/auth.js";
import { renderTopbar } from "../../../componentes/topBar/topBar.js";

const userData = JSON.parse(localStorage.getItem('userData'));

document.addEventListener('DOMContentLoaded', () => {
    protectPage('cadastros');
    renderTopbar('cadastros', userData.permissions_list);
});

document.addEventListener('DOMContentLoaded', function () {

            const supplierId = new URLSearchParams(window.location.search).get('id');
            const form = document.getElementById('supplierForm');

            // --- LÓGICA DE INICIALIZAÇÃO ---
            const initialize = () => {
                setupEventListeners();
                if (supplierId) {
                    prepareEditMode(supplierId);
                }
            };

            const prepareEditMode = async (id) => {
                document.querySelector('h1').textContent = 'Editar Fornecedor';
                document.getElementById('saveButton').innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';

                try {
                    const response = await fetch(`${apiUrl}/api/cadastros/suppliers/${id}/`, {
                        credentials: 'include'
                    });
                    if (response.status === 401) {
                        window.location.href = 'fornecedores.html';
                        return;
                    }
                    if (!response.ok) throw new Error('Não foi possível carregar os dados.');
                    const supplier = await response.json();
                    populateForm(supplier);
                } catch (error) {
                    showToast('Erro', error.message, 'error');
                    setTimeout(() => window.location.href = 'fornecedores.html', 2000);
                }
            };

            const populateForm = (supplier) => {
                document.getElementById('supplierId').value = supplier.id;
                document.getElementById('supplierName').value = supplier.name;
                document.getElementById('supplierTradeName').value = supplier.trade_name || '';
                document.querySelector(`input[name="supplierType"][value="${supplier.supplier_type}"]`).checked = true;
                document.getElementById('supplierDocument').value = supplier.document;
                document.getElementById('supplierStateRegistration').value = supplier.state_registration || '';
                document.getElementById('supplierMunicipalRegistration').value = supplier.municipal_registration || '';
                document.getElementById('supplierContactName').value = supplier.contact_name || '';
                document.getElementById('supplierPhone').value = supplier.phone;
                document.getElementById('supplierCellphone').value = supplier.cellphone || '';
                document.getElementById('supplierEmail').value = supplier.email;
                document.getElementById('supplierCategory').value = supplier.category || '';
                document.getElementById('supplierStatus').checked = supplier.status === 'active';
                document.getElementById('supplierNotes').value = supplier.notes || '';

                if (supplier.address) {
                    const { cep, street, number, complement, neighborhood, city, state } = supplier.address;
                    document.getElementById('supplierCEP').value = cep || '';
                    document.getElementById('supplierStreet').value = street || '';
                    document.getElementById('supplierNumber').value = number || '';
                    document.getElementById('supplierComplement').value = complement || '';
                    document.getElementById('supplierNeighborhood').value = neighborhood || '';
                    document.getElementById('supplierCity').value = city || '';
                    document.getElementById('supplierState').value = state || '';
                }

                if (supplier.bank_account) {
                    const { bank, agency, account, account_type, pix_key } = supplier.bank_account;
                    document.getElementById('supplierBank').value = bank || '';
                    document.getElementById('supplierAgency').value = agency || '';
                    document.getElementById('supplierAccount').value = account || '';
                    document.getElementById('supplierAccountType').value = account_type || 'corrente';
                    document.getElementById('supplierPix').value = pix_key || '';
                }

                // Dispara evento para ajustar campos PF/PJ
                document.querySelector('input[name="supplierType"]:checked').dispatchEvent(new Event('change'));
            };

            // --- LÓGICA DE EVENTOS ---
            const setupEventListeners = () => {
                document.querySelectorAll('input[name="supplierType"]').forEach(radio => {
                    radio.addEventListener('change', handleSupplierTypeChange);
                });
                document.getElementById('searchCEP').addEventListener('click', searchCEP);
                form.addEventListener('submit', handleFormSubmit);
            };

            const handleSupplierTypeChange = (e) => {
                const isPJ = e.target.value === 'PJ';
                document.getElementById('documentLabel').textContent = isPJ ? 'CNPJ*' : 'CPF*';
                document.getElementById('stateRegistrationField').style.display = isPJ ? 'block' : 'none';
                document.getElementById('municipalRegistrationField').style.display = isPJ ? 'block' : 'none';
            };

            const searchCEP = async () => { /* ... sua função de CEP existente ... */ };

            const validateForm = () => {
                const requiredFields = {
                    'supplierName': 'Nome/Razão Social',
                    'supplierDocument': 'Documento (CPF/CNPJ)',
                    'supplierPhone': 'Telefone',
                    'supplierEmail': 'E-mail'
                };

                for (const id in requiredFields) {
                    const field = document.getElementById(id);
                    if (!field.value.trim()) {
                        // Usa a função de toast para mostrar o erro de forma mais elegante
                        showToast('Erro de Validação', `O campo "${requiredFields[id]}" é obrigatório.`, 'error');
                        field.focus(); // Foca no campo com erro
                        return false; // Interrompe a validação
                    }
                }
                return true; // Retorna verdadeiro se todos os campos obrigatórios estiverem preenchidos
            };
            const handleFormSubmit = async (e) => {
                e.preventDefault();

                if (!validateForm()) {
                    return;
                }

                const id = document.getElementById('supplierId').value;
                const url = id ? `${apiUrl}/api/cadastros/suppliers/${id}/` : `${apiUrl}/api/cadastros/suppliers/`;
                const method = id ? 'PUT' : 'POST';

                const payload = {
                    name: document.getElementById('supplierName').value,
                    trade_name: document.getElementById('supplierTradeName').value,
                    supplier_type: document.querySelector('input[name="supplierType"]:checked').value,
                    document: document.getElementById('supplierDocument').value,
                    state_registration: document.getElementById('supplierStateRegistration').value,
                    municipal_registration: document.getElementById('supplierMunicipalRegistration').value,
                    contact_name: document.getElementById('supplierContactName').value,
                    phone: document.getElementById('supplierPhone').value,
                    cellphone: document.getElementById('supplierCellphone').value,
                    email: document.getElementById('supplierEmail').value,
                    category: document.getElementById('supplierCategory').value,
                    status: document.getElementById('supplierStatus').checked ? 'active' : 'inactive',
                    notes: document.getElementById('supplierNotes').value
                };

                const cep = document.getElementById('supplierCEP').value;
                if (cep) {
                    payload.address = {
                        cep,
                        street: document.getElementById('supplierStreet').value,
                        number: document.getElementById('supplierNumber').value,
                        complement: document.getElementById('supplierComplement').value,
                        neighborhood: document.getElementById('supplierNeighborhood').value,
                        city: document.getElementById('supplierCity').value,
                        state: document.getElementById('supplierState').value
                    };
                }

                const bank = document.getElementById('supplierBank').value;
                if (bank) {
                    payload.bank_account = {
                        bank,
                        agency: document.getElementById('supplierAgency').value,
                        account: document.getElementById('supplierAccount').value,
                        account_type: document.getElementById('supplierAccountType').value,
                        pix_key: document.getElementById('supplierPix').value
                    };
                }

                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        const errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
                        throw new Error(errorMessage || 'Erro ao salvar os dados.');
                    }

                    showToast('Sucesso!', 'Fornecedor salvo com sucesso.', 'success');
                    setTimeout(() => window.location.href = '/src/pages/fornecedores/fornecedores.html', 1500);
                } catch (error) {
                    showToast('Erro!', error.message, 'error');
                }
            };

            initialize();
        });

        function showToast(title, message, type) {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toast-message');

            // Define a cor de fundo conforme o tipo
            let bgColor = 'bg-gray-800';
            if (type === 'success') bgColor = 'bg-green-600';
            if (type === 'error') bgColor = 'bg-red-600';
            if (type === 'warning') bgColor = 'bg-yellow-600';
            if (type === 'info') bgColor = 'bg-blue-600';

            toast.className = `fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white ${bgColor}`;
            toastMessage.textContent = message;

            toast.classList.remove('hidden');
            toast.classList.add('animate-fade-in');

            // Oculta o toast após 4 segundos
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }
