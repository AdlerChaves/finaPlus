const apiUrl = import.meta.env.VITE_API_URL; 

        function getQueryParams() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                card_id: urlParams.get('card_id'),
                month: urlParams.get('month'),
                year: urlParams.get('year')
            };
        }
        const formatMoney = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formatDate = (dateString) => {
            if (!dateString) return '--/--/----';
            if (dateString.includes('/')) return dateString;
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}/${y}`;
        };

        // --- Função para Carregar Detalhes (sem alterações) ---
        async function loadBillDetails() {
            const params = getQueryParams();
            
            if (!params.card_id || !params.month || !params.year) {
                document.getElementById('card-name').textContent = "Parâmetros inválidos na URL.";
                return;
            }
            const url = `${apiUrl}/api/finance/card-bill-detail/?card_id=${params.card_id}&month=${params.month}&year=${params.year}`;
            try {
                const response = await fetch(url, { credentials: 'include' });
                if (response.status === 401) { window.location.href = '../login.html'; return; }
                if (!response.ok) throw new Error('Falha ao buscar os detalhes da fatura.');
                const data = await response.json();
                renderBillData(data);
            } catch (error) {
                console.error("Erro:", error);
                document.getElementById('card-name').textContent = "Erro ao carregar os dados.";
            }
        }

        // --- Função para Renderizar Dados (ATUALIZADA) ---
        function renderBillData(data) {
            document.getElementById('card-name').textContent = data.card_name;
            document.getElementById('bill-period').textContent = data.bill_period;
            document.getElementById('bill-total').textContent = formatMoney(data.total_amount);
            document.getElementById('bill-paid').textContent = formatMoney(data.paid_amount);
            document.getElementById('bill-due-date').textContent = formatDate(data.due_date);

            // Atualiza status e visibilidade do botão de pagar
            const statusElement = document.getElementById('bill-status');
            const payButton = document.getElementById('mark-as-paid-btn');
            const totalToPay = data.total_amount - data.paid_amount;

            if (totalToPay <= 0) {
                statusElement.innerHTML = '<span class="px-2 py-1 rounded-full bg-green-100 text-green-800">Fatura Paga</span>';
                payButton.classList.add('hidden');
            } else {
                statusElement.innerHTML = `<span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Pendente (${formatMoney(totalToPay)} em aberto)</span>`;
                payButton.classList.remove('hidden');
            }

            // Popula a lista de transações
            const transactionsList = document.getElementById('transactions-list');
            transactionsList.innerHTML = '';
            if (data.transactions && data.transactions.length > 0) {
                data.transactions.forEach(t => {
                    transactionsList.innerHTML += `
                        <tr class="${t.status === 'pago' ? 'bg-green-50' : ''}">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(t.transaction_date)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${t.description}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.category_name || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">${formatMoney(t.amount)}</td>
                        </tr>
                    `;
                });
            } else {
                transactionsList.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhuma transação para esta fatura.</td></tr>`;
            }
        }

        // --- LÓGICA DO MODAL DE PAGAMENTO (NOVA) ---
        const payModal = document.getElementById('mark-as-paid-modal');

        async function openPayModal() {
            
            const accountSelect = document.getElementById('payment-account');
            
            // Popula o valor a ser pago e a data
            const totalBill = parseFloat(document.getElementById('bill-total').textContent.replace('R$', '').replace('.', '').replace(',', '.'));
            const totalPaid = parseFloat(document.getElementById('bill-paid').textContent.replace('R$', '').replace('.', '').replace(',', '.'));
            document.getElementById('payment-amount').value = (totalBill - totalPaid).toFixed(2);
            document.getElementById('payment-date').valueAsDate = new Date();

            // Busca as contas bancárias
            accountSelect.innerHTML = '<option value="">Carregando...</option>';
            try {
                 const response = await fetch(`${apiUrl}/api/finance/bank-accounts/?is_active=true`, { credentials: 'include' });
                if (response.status === 401) { window.location.href = '../login.html'; return; }
                const accounts = await response.json();
                accountSelect.innerHTML = '<option value="">Selecione a conta</option>';
                accounts.forEach(acc => {
                    accountSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${formatMoney(acc.initial_balance)})</option>`;
                });
            } catch (error) {
                console.error('Erro ao buscar contas:', error);
                accountSelect.innerHTML = '<option value="">Erro ao carregar contas</option>';
            }
            
            payModal.classList.remove('hidden');
        }

        function closePayModal() {
            payModal.classList.add('hidden');
        }

        async function confirmPayment(event) {
            event.preventDefault();
            
            const params = getQueryParams();

            const payload = {
                card_id: params.card_id,
                month: params.month,
                year: params.year,
                bank_account_id: document.getElementById('payment-account').value,
                amount: document.getElementById('payment-amount').value,
                payment_date: document.getElementById('payment-date').value
            };

            if (!payload.bank_account_id) {
                alert("Por favor, selecione a conta de origem.");
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/api/finance/pay-card-bill/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Erro ao processar pagamento.');
                
                alert('Fatura paga com sucesso!');
                closePayModal();
                loadBillDetails();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        }


        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            loadBillDetails();
            document.getElementById('mark-as-paid-btn').addEventListener('click', openPayModal);
            document.getElementById('cancel-payment-btn').addEventListener('click', closePayModal);
            document.getElementById('payment-form').addEventListener('submit', confirmPayment);
        });