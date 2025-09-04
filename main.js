import { protectPage } from './src/componentes/auth';
import { renderTopbar } from './src/componentes/topBar/topBar';

const apiUrl = import.meta.env.VITE_API_URL;

let barChart = null;
let lineChart = null;


document.addEventListener('DOMContentLoaded', async function () { // MUDANÇA 1: Adicionado "async" aqui
    try {
        // MUDANÇA 2: "await" garante que o código só continue DEPOIS que a autenticação for confirmada.
        // Se o usuário não estiver logado, protectPage irá redirecioná-lo e o código abaixo nunca será executado.
        await protectPage('dashboard');

        const userData = JSON.parse(localStorage.getItem('userData'));

        if (userData) {
            // 3. Renderiza a topbar, passando as permissões
            renderTopbar('dashboard', userData.permissions_list);
        }

        setupMobileMenu();
        displayUserInfo(); 
        loadDashboardData();
        loadChartData();
        loadCashFlowChartData();

    } catch (error) {
        // O próprio protectPage já lida com o redirecionamento, mas é uma boa prática ter um catch.
        console.error("Ocorreu um erro durante a inicialização da página:", error);
    }
});


// Função para exibir as informações do usuário
function displayUserInfo() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        const nameSpan = document.getElementById('user-name-display');
        if (nameSpan) {
            nameSpan.textContent = userName;
        }
    }
}


// Adicione esta nova função para carregar os dados do gráfico Receitas Vs Despesas
async function loadChartData() {

    try {
        const response = await fetch(`${apiUrl}/finance/charts/income-expense/`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao buscar dados do gráfico.');

        const data = await response.json();
        updateBarChart(data); // Chama a função para atualizar o gráfico com os novos dados

    } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error);
    }
}

// Adicione esta função para redesenhar o gráfico
function updateBarChart(data) {
    const ctx = document.getElementById('barChart')?.getContext('2d');
    if (!ctx) return;

    // Destrói o gráfico antigo, se ele existir, para evitar bugs
    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Receitas',
                data: data.income_data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }, {
                label: 'Despesas',
                data: data.expense_data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Adicione esta nova função para carregar os dados do gráfico de fluxo de caixa
async function loadCashFlowChartData() {

    try {
        const response = await fetch(`${apiUrl}/api/finance/charts/cash-flow/`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao buscar dados do fluxo de caixa.');

        const data = await response.json();
        updateLineChart(data);

    } catch (error) {
        console.error("Erro ao carregar dados do fluxo de caixa:", error);
    }
}

// Adicione esta função para redesenhar o gráfico de linha
function updateLineChart(data) {
    const ctx = document.getElementById('lineChart')?.getContext('2d');
    if (!ctx) return;

    if (lineChart) {
        lineChart.destroy();
    }

    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Saldo Acumulado',
                data: data.cumulative_balance,
                fill: false,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false // O saldo pode ser negativo, então não forçamos começar em zero
                }
            }
        }
    });
}


// Função para configurar a lógica do menu mobile
export function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuButton && mobileSidebar && closeSidebar && sidebarOverlay) {
        mobileMenuButton.addEventListener('click', () => {
            mobileSidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        });

        const closeAction = () => {
            mobileSidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        };

        closeSidebar.addEventListener('click', closeAction);
        sidebarOverlay.addEventListener('click', closeAction);
    }
}

async function loadDashboardData() {
    console.log("Iniciando a função loadDashboardData...");


    try {
        const response = await fetch(`${apiUrl}/api/finance/dashboard/`, {
            credentials: 'include',
        });

        console.log("Resposta da API recebida com status:", response.status);

        if (response.status === 401) {
            console.error("Não autorizado (401). Redirecionando para login.");
            window.location.href = './src/pages/login/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Falha na rede: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Dados recebidos do backend:", data);

        // Se os dados foram recebidos, chama as funções para popular a tela
        updateSummaryCards(data.summary_cards);
        displayUpcomingPayables(data.alerts.upcoming_payables);
        displayRecentTransactions(data.recent_transactions);

        if (data.user_info && data.user_info.name) {
            localStorage.setItem('userName', data.user_info.name);
            displayUserInfo();
        }

    } catch (error) {
        console.error('Erro fatal ao buscar dados do dashboard:', error);
        // Exibe uma mensagem de erro clara para o usuário
        const container = document.getElementById('upcoming-payables-container');
        if (container) {
            container.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg">
                    <p class="font-bold">Erro de Conexão</p>
                    <p class="text-sm">Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente recarregar a página.</p>
                </div>`;
        }
    }
}


// --- FUNÇÕES AUXILIARES PARA ATUALIZAR A UI ---

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

function updateSummaryCards(summary) {
    if (!summary) return;
    document.getElementById('current-balance').textContent = formatCurrency(summary.current_balance);
    document.getElementById('monthly-income').textContent = formatCurrency(summary.monthly_income);
    document.getElementById('monthly-expenses').textContent = formatCurrency(summary.monthly_expenses);

    const monthlyResultEl = document.getElementById('monthly-result');
    monthlyResultEl.textContent = formatCurrency(summary.monthly_result);
    monthlyResultEl.className = summary.monthly_result >= 0 ? 'text-2xl font-bold mt-1 text-green-600' : 'text-2xl font-bold mt-1 text-red-600';

    document.getElementById('total-payables').textContent = formatCurrency(summary.total_payables);
    document.getElementById('total-receivables').textContent = formatCurrency(summary.total_receivables);
}

function displayUpcomingPayables(payables) {
    const container = document.getElementById('upcoming-payables-container');
    if (!container) return;
    container.innerHTML = '';

    if (!payables || payables.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">Nenhum vencimento nos próximos 7 dias.</p>';
        return;
    }

    payables.forEach(payable => {
        container.innerHTML += `
                <div class="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                        <p class="text-sm font-medium">${payable.description}</p>
                        <p class="text-xs text-gray-500">Vence em: ${formatDate(payable.due_date)}</p>
                    </div>
                    <p class="text-sm font-bold text-yellow-600">${formatCurrency(payable.amount)}</p>
                </div>`;
    });
}

function displayRecentTransactions(transactions) {
    const container = document.getElementById('recent-transactions-container');
    if (!container) return;
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 p-3">Nenhum lançamento recente.</p>';
        return;
    }

    transactions.forEach(transaction => {
        const isIncome = transaction.type === 'entrada';
        const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
        const amountSign = isIncome ? '+' : '-';

        container.innerHTML += `
                <div class="flex justify-between items-center pb-3 mb-3 border-b last:border-b-0">
                    <div>
                        <p class="text-sm font-medium">${transaction.description}</p>
                        <p class="text-xs text-gray-500">${formatDate(transaction.transaction_date)}</p>
                    </div>
                    <p class="text-sm font-bold ${amountClass}">${amountSign} ${formatCurrency(transaction.amount)}</p>
                </div>`;
    });
}

