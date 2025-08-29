import { renderTopbar } from "./topbar/topBar.js";

const apiUrl = import.meta.env.VITE_API_URL;

/**
 * Verifica a autenticação do usuário fazendo uma requisição para o endpoint /me/.
 * Se bem-sucedido, retorna os dados do usuário.
 * Se falhar, redireciona para a página de login.
 * @returns {Promise<object|null>} Uma promessa que resolve com os dados do usuário ou nula se ocorrer um erro.
 */
async function verifyAuthentication() {
    try {
        const response = await fetch(`${apiUrl}/api/accounts/me/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // ESSENCIAL: Garante que os cookies HttpOnly sejam enviados com a requisição
            credentials: 'include',
        });

        if (response.ok) {
            const userData = await response.json();
            // Retorna os dados do usuário para serem usados na página
            return userData;
        } else {
            // Se a resposta for 401, 403, ou qualquer outro erro, o usuário não está autenticado
            throw new Error('Usuário não autenticado.');
        }

    } catch (error) {
        console.error("Falha na verificação de autenticação:", error.message);
        // Limpa qualquer dado antigo que possa ter ficado no localStorage
        localStorage.clear();
        // Redireciona para o login
        window.location.href = '/src/pages/login/login.html'; // Ajuste o caminho se necessário
        return null;
    }
}


/**
 * Controla a renderização de elementos da UI com base nas permissões do usuário.
 * Esta função deve ser chamada APÓS a autenticação ser verificada.
 * @param {string} requiredPermission - A permissão necessária para a página atual.
 * @param {Array<string>} userPermissionsArray - A lista de permissões do usuário vinda do backend.
 */
function managePageAccess(requiredPermission, userPermissionsArray = []) {
    // A lógica de mapeamento de permissões que você já tinha
    const permissionsLookup = {};
    userPermissionsArray.forEach(p => {
        if (typeof p === 'string') {
            permissionsLookup[p.toLowerCase()] = true;
        }
    });

    const permissionMap = {
        'dashboard': ['dashboard'],
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

    // A verificação de acesso agora controla apenas o conteúdo da página, não o redirecionamento
    const userRole = localStorage.getItem('userRole'); // Você pode obter isso dos dados do usuário se vier da API
    if (userRole !== 'admin' && requiredPermission && !permissionsLookup[requiredPermission.toLowerCase()]) {
        console.warn(`Acesso negado para conteúdo. Permissão necessária: '${requiredPermission}'`);
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = '/index.html'; // Redireciona para o dashboard
        return;
    }

    // Se tudo estiver OK, renderiza os componentes da página, como o Topbar
    renderTopbar(requiredPermission, permissionsLookup);
}


/**
 * Função principal para proteger uma página.
 * Primeiro verifica a autenticação e depois gerencia o acesso ao conteúdo.
 * @param {string} requiredPermission - A permissão necessária para a página atual (opcional).
 */
export async function protectPage(requiredPermission) {
    const userData = await verifyAuthentication();

    if (userData) {
        // Se a autenticação for bem-sucedida, userData conterá os dados do usuário
        // Agora podemos usar as permissões para gerenciar o acesso ao conteúdo da página
        const permissions = userData.permissions_list || [];
        managePageAccess(requiredPermission, permissions);

        // Opcional: Salve dados não sensíveis no localStorage para acesso rápido na UI
        const userName = `${userData.first_name} ${userData.last_name}`.trim();
        if (userName) {
            localStorage.setItem('userName', userName);
        }
    }
}