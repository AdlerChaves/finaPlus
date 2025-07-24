/**
 * Verifica se o usuário tem permissão para acessar uma página, baseado nas
 * permissões salvas no localStorage. Redireciona para o login se não tiver.
 * @param {string} requiredPermission - A chave de permissão necessária para a página.
 */
function protectPage(requiredPermission) {
    
    const permissionsString = localStorage.getItem('userPermissions');

    if (!permissionsString) {
        console.error("Permissões não encontradas. Redirecionando para login.");
        // Ajusta o caminho para o login dependendo de onde a página atual está
        const loginPath = window.location.pathname.includes('/telas/') ? 'login.html' : 'telas/login.html';
        window.location.href = loginPath;
        return; // Interrompe a execução
    }

    // O restante do seu código de lógica de permissões permanece o mesmo,
    // pois ele é valioso para a experiência do usuário no frontend.
    let userPermissionsArray = [];
    try {
        userPermissionsArray = JSON.parse(permissionsString) || [];
    } catch (e) {
        console.error("Erro ao parsear permissões. Redirecionando para login.", e);
        localStorage.clear();
        const loginPath = window.location.pathname.includes('/telas/') ? 'login.html' : 'telas/login.html';
        window.location.href = loginPath;
        return;
    }

    const permissionsLookup = {};
    userPermissionsArray.forEach(p => {
        if (typeof p === 'string') {
            permissionsLookup[p.toLowerCase()] = true;
        }
    });

    const permissionMap = {
        'pagamentos': ['contas a pagar', 'contas a receber', 'pagamentos', 'contas-a-receber'],
        'movimentacoes': ['entradas', 'saidas'],
        'relatorios': ['dre', 'dfc'],
        'cadastros': ['clientes', 'fornecedores', 'usuarios', 'categorias'],
        'contas': ['contas bancarias', 'contas'],
        'configuracoes': ['configuracoes'] 
    };
    
    for (const key in permissionMap) {
        if (permissionMap[key].some(p => permissionsLookup[p])) {
            permissionsLookup[key] = true;
        }
    }

    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin' && !permissionsLookup[requiredPermission.toLowerCase()]) {
        console.warn(`Acesso negado. Permissão necessária: '${requiredPermission}'`);
        alert("Você não tem permissão para acessar esta página.");
        const indexPath = window.location.pathname.includes('/telas/') ? '../index.html' : 'index.html';
        window.location.href = indexPath;
        return;
    }

    // Se tudo estiver OK, renderiza o Topbar.
    renderTopbar(requiredPermission, permissionsLookup);
}