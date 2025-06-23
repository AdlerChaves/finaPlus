document.addEventListener('DOMContentLoaded', function () {

    // --- Lógica do Menu ---
    // Exemplo de permissões para um usuário administrador.
    const userPermissions = {
        dashboard: true,
        movimentacoes: true,
        relatorios: true,
        pagamentos: true,
        contas: true,
        cadastros: true,
        configuracoes: true
    };

    // 1. RENDERIZA A TOPBAR PRIMEIRO
    renderTopbar('dashboard', userPermissions);

    // --- Lógica do Menu Lateral para Mobile ---
    // O `renderTopbar` cria o botão, então o listener precisa vir depois.
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if(mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }   

    // --- Lógica dos Gráficos do Dashboard ---

    // Gráfico de Barras - Receitas vs Despesas
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [
                    { label: 'Receitas', data: [6500, 5900, 8000, 8100, 8600, 8750], backgroundColor: '#10B981', borderRadius: 4 },
                    { label: 'Despesas', data: [4800, 5200, 6000, 5800, 5100, 5320], backgroundColor: '#EF4444', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { callback: (value) => 'R$ ' + value.toLocaleString('pt-BR') } } }
            }
        });
    }

    // Gráfico de Linha - Fluxo de Caixa Acumulado
    const lineCtx = document.getElementById('lineChart')?.getContext('2d');
    if (lineCtx) {
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Saldo Acumulado', data: [2500, 3200, 5200, 7500, 9800, 15420],
                    borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2, tension: 0.1, fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { ticks: { callback: (value) => 'R$ ' + value.toLocaleString('pt-BR') } } }
            }
        });
    }

    // Gráfico de Pizza - Distribuição de Despesas
    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Fornecedores', 'Salários', 'Aluguel', 'Serviços', 'Outros'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#64748B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { legend: { position: 'right' } }
            }
        });
    }
});