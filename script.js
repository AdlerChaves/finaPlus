document.addEventListener('DOMContentLoaded', function() {
    // 1. Carregar a Topbar, informando que estamos na página raiz.
    carregarTopbar('dashboard');

    // 2. Inicializar os gráficos do dashboard.
    const dreCtx = document.getElementById('dreChart').getContext('2d');
    const dreChart = new Chart(dreCtx, {
        // ... (código do gráfico DRE que já estava aqui) ...
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Receitas',
                    data: [12000, 9000, 14000, 11000, 10000, 13500],
                    backgroundColor: '#4ade80',
                    borderRadius: 4
                },
                {
                    label: 'Custos',
                    data: [7000, 5000, 8000, 6500, 6000, 7500],
                    backgroundColor: '#f87171',
                    borderRadius: 4
                },
                {
                    label: 'Despesas',
                    data: [3500, 2500, 4000, 3000, 3500, 4000],
                    backgroundColor: '#fbbf24',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
            scales: { x: { stacked: false, grid: { display: false } }, y: { stacked: false, beginAtZero: true, ticks: { callback: function (value) { return 'R$ ' + value.toLocaleString(); } } } }
        }
    });

    const dfcCtx = document.getElementById('dfcChart').getContext('2d');
    const dfcChart = new Chart(dfcCtx, {
        // ... (código do gráfico DFC que já estava aqui) ...
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Entradas',
                    data: [12000, 9000, 14000, 11000, 10000, 13500],
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: true
                },
                {
                    label: 'Saídas',
                    data: [10500, 7500, 12000, 9500, 9000, 11500],
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: function (value) { return 'R$ ' + value.toLocaleString(); } } } }
        }
    });
});