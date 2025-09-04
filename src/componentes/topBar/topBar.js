/**
 * Renderiza a barra de navegação superior de forma dinâmica.
 * @param {string} activeMenu - O identificador do menu que deve aparecer como ativo. Ex: 'dashboard', 'movimentacoes', 'relatorios'.
 * @param {object} permissions - Um objeto que define quais seções o usuário pode ver.
 */
export async function renderTopbar(activeMenu, permissions) {
    try {
        const htmlPath = '/componentes/topBar/topBar.html';

        const response = await fetch(htmlPath);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar o topBar.html: ${response.statusText}`);
        }
        const topbarHTML = await response.text();
        document.body.insertAdjacentHTML('afterbegin', topbarHTML);

        // Agora que o HTML está no DOM, podemos manipulá-lo
        populateMenus(activeMenu, permissions);

        // Adiciona o evento para o botão do menu mobile
        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

    } catch (error) {
        console.error("Erro ao renderizar o topbar:", error);
    }
}

function populateMenus(activeMenu, permissions) {
    const desktopMenuContainer = document.getElementById('desktop-menu');
    const mobileMenuContainer = document.getElementById('mobile-menu');

    if (!desktopMenuContainer || !mobileMenuContainer) return;

    // Determina o prefixo do caminho para as páginas baseado na localização atual.
    const isRoot = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
    const pathPrefix = isRoot ? 'telas/' : '../telas/'; // Ajuste o caminho se necessário

    // Estrutura do menu
    const menuConfig = [
        // ... (copie a sua variável menuConfig para cá, sem alterações)
        {
            name: 'Movimentações',
            permission: 'movimentacoes',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>`,
            submenus: [
                { name: 'Entradas', href: `${pathPrefix}entradas.html` },
                { name: 'Saídas', href: `${pathPrefix}saidas.html` }
            ]
        },
        // ... cole o resto da sua configuração de menu aqui
    ];


    let desktopNavHTML = '';
    let mobileNavHTML = '';

    // Link do Dashboard
    const dashboardActiveClass = activeMenu === 'dashboard' ? 'active font-semibold text-blue-600' : 'text-gray-700';
    desktopNavHTML += `<a href="${isRoot ? 'index.html' : '../../index.html'}" class="menu-item ${dashboardActiveClass} hover:text-blue-500 transition-colors flex items-center">Dashboard</a>`;
    mobileNavHTML += `<a href="${isRoot ? 'index.html' : '../../index.html'}" class="block py-2 ${dashboardActiveClass} hover:text-blue-500">Dashboard</a>`;

    // Constrói os menus baseados nas permissões
    menuConfig.forEach(menu => {
        if (permissions[menu.permission]) {
            const menuActiveClass = activeMenu === menu.permission ? 'active font-semibold text-blue-600' : 'text-gray-700';
            if (menu.isSingleLink) {
                desktopNavHTML += `<a href="${menu.href}" class="menu-item ${menuActiveClass} hover:text-blue-500 transition-colors flex items-center self-center">${menu.icon} ${menu.name}</a>`;
                mobileNavHTML += `<a href="${menu.href}" class="block py-2 ${menuActiveClass} hover:text-blue-500">${menu.name}</a>`;
            } else {
                desktopNavHTML += `
                    <div class="relative group py-2">
                        <button class="px-3 py-2 ${menuActiveClass} hover:text-blue-500 transition-colors flex items-center">
                            ${menu.icon} ${menu.name}
                        </button>
                        <div class="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-30 hidden group-hover:block">
                            ${menu.submenus.map(sub => `<a href="${sub.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">${sub.name}</a>`).join('')}
                        </div>
                    </div>`;
                mobileNavHTML += `
                    <div class="py-2">
                        <p class="font-semibold text-gray-500 text-sm px-4">${menu.name}</p>
                        ${menu.submenus.map(sub => `<a href="${sub.href}" class="block pl-8 pr-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">${sub.name}</a>`).join('')}
                    </div>`;
            }
        }
    });

    desktopMenuContainer.innerHTML = desktopNavHTML;
    mobileMenuContainer.innerHTML = mobileNavHTML;
}