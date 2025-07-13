/**
 * Verifica se o usuário está autenticado e tem permissão para acessar uma página.
 * Se não tiver, redireciona para o login.
 * Se tiver, renderiza o topbar com as permissões corretas.
 * @param {string} requiredPermission - A chave de permissão necessária para acessar a página atual.
 */
function protectPage(requiredPermission) {
    const token = localStorage.getItem('accessToken');
    const permissionsString = localStorage.getItem('userPermissions');

    // 1. Verifica se o token existe. Se não, redireciona para o login.
    if (!token) {
        console.error("Token não encontrado. Redirecionando para login.");
        // Ajusta o caminho para o login dependendo se a página atual está na raiz ou em 'telas'
        const loginPath = window.location.pathname.includes('/telas/') ? 'login.html' : 'telas/login.html';
        window.location.href = loginPath;
        return;
    }

    // 2. Tenta parsear as permissões.
    let userPermissions = {};
    try {
        userPermissions = JSON.parse(permissionsString) || {};
    } catch (e) {
        console.error("Erro ao parsear permissões. Redirecionando para login.", e);
        // Limpa o armazenamento e redireciona se as permissões estiverem corrompidas
        localStorage.clear();
        const loginPath = window.location.pathname.includes('/telas/') ? 'login.html' : 'telas/login.html';
        window.location.href = loginPath;
        return;
    }

    // 3. Verifica se o usuário tem a permissão necessária para a página.
    // O administrador (role 'admin') tem acesso a tudo, independentemente da lista.
    const userRole = localStorage.getItem('userRole'); // Supondo que você salve o role no login
    if (userRole !== 'admin' && !userPermissions[requiredPermission]) {
        console.warn(`Acesso negado. Permissão necessária: '${requiredPermission}'`);
        alert("Você não tem permissão para acessar esta página.");
        // Redireciona para o dashboard como uma página padrão segura
        const indexPath = window.location.pathname.includes('/telas/') ? '../index.html' : 'index.html';
        window.location.href = indexPath;
        return;
    }

    // 4. Se tudo estiver OK, renderiza o Topbar.
    // O primeiro argumento é a chave do menu ativo, que é a mesma que a permissão necessária.
    renderTopbar(requiredPermission, userPermissions);
}