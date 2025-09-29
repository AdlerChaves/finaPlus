/**
 * Renderiza a barra de navegação superior de forma dinâmica.
 * @param {string} activeMenu - O identificador do menu que deve aparecer como ativo. Ex: 'dashboard', 'movimentacoes', 'relatorios'.
 * @param {object} permissions - Um array de permissões do usuário.
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

        populateMenus(activeMenu, permissions);

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

    // --- CORREÇÃO PRINCIPAL AQUI ---
    // Os caminhos (href) agora refletem a estrutura de pastas real do projeto.
    const menuConfig = [
        { 
            name: 'Movimentações', 
            permission: 'movimentacoes',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>`,
            submenus: [
                { name: 'Entradas', href: '/src/pages/banking/entradas/entradas.html' },
                { name: 'Saídas', href: '/src/pages/banking/saidas/saidas.html' }
            ] 
        },
        // { 
        //     name: 'Relatórios', 
        //     permission: 'relatorios',
        //     icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
        //     submenus: [
        //         { name: 'DRE', href: '/src/pages/relatorios/DRE/DRE.html' },
        //         { name: 'DFC', href: '/src/pages/relatorios/DFC/DFC.html' }
        //     ] 
        // },
        { 
            name: 'Pagamentos/Recebimentos', 
            permission: 'pagamentos',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
            submenus: [
                { name: 'Contas a Pagar', href: '/src/pages/banking/contasPagar/contasPagar.html' },
                { name: 'Contas a Receber', href: '/src/pages/banking/contasReceber/contasReceber.html' }
            ] 
        },
        { 
            name: 'Contas bancárias', 
            permission: 'contas',
            isSingleLink: true,
            href: '/src/pages/banking/contas/contas.html',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 4 8 4 8-4 8-4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v10"></path></svg>`,
        },
        { 
            name: 'Cadastros', 
            permission: 'cadastros',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`,
            submenus: [
                { name: 'Clientes', href: '/src/pages/clientes/clientes.html' },
                { name: 'Fornecedores', href: '/src/pages/fornecedores/fornecedores.html' },
                { name: 'Usuários', href: '/src/pages/cadastros/usuario/cadastroUsuario.html' },
                { name: 'Categorias', href: '/src/pages/cadastros/categorias/cadastroCategorias.html' },
            ] 
        },
        {
            name: 'Configurações',
            permission: 'configuracoes',
            isSingleLink: true,
            href: '/src/pages/configuracoes/configuracoes.html',
            icon: `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`
        }
    ];

    let desktopNavHTML = '';
    let mobileNavHTML = '';

    const dashboardActiveClass = activeMenu === 'dashboard' ? 'active font-semibold text-blue-600' : 'text-gray-700';
    desktopNavHTML += `<a href="/index.html" class="menu-item ${dashboardActiveClass} hover:text-blue-500 transition-colors flex items-center">Dashboard</a>`;
    mobileNavHTML += `<a href="/index.html" class="block py-2 ${dashboardActiveClass} hover:text-blue-500">Dashboard</a>`;

    menuConfig.forEach(menu => {
        if (permissions && permissions.includes(menu.permission)) {
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