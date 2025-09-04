const apiUrl = import.meta.env.VITE_API_URL;

/**
 * Busca os dados do usuário logado no endpoint /api/accounts/me/,
 * armazena no localStorage e retorna os dados.
 * @returns {Promise<object|null>} Os dados do usuário ou null se a requisição falhar.
 */
async function fetchAndStoreUserData() {
    try {
        const response = await fetch(`${apiUrl}/api/accounts/me/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' 
        });

        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('userData', JSON.stringify(userData));
            return userData;
        } else {
            localStorage.removeItem('userData');
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        localStorage.removeItem('userData');
        return null;
    }
}

/**
 * Protege uma página, verificando se o usuário está logado e se tem a permissão necessária.
 * @param {string} [requiredPermission] - A permissão necessária para acessar a página.
 */
export async function protectPage(requiredPermission) {
    let userData = JSON.parse(localStorage.getItem('userData'));

    // Se os dados não estiverem no localStorage, busca do servidor.
    // Isso é crucial na primeira vez que o usuário carrega a página após o login.
    if (!userData) {
        userData = await fetchAndStoreUserData();
    }

    // Se, mesmo após a tentativa de busca, não houver dados, o usuário não está logado.
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }

    // Agora, com os dados do usuário garantidamente carregados, verificamos a permissão.
    if (requiredPermission && (!userData.permissions_list || !userData.permissions_list.includes(requiredPermission))) {
        // O usuário não tem a permissão necessária.
        console.warn(`Acesso negado. Permissão necessária: ${requiredPermission}`);
        // Redireciona para a página inicial (ou uma página de "acesso negado").
        window.location.href = '/index.html';
        return;
    }

    // Se o usuário está logado e tem a permissão, preenchemos o nome dele na página.
    // Isso confirma visualmente que os dados foram carregados.
    const userNameElement = document.getElementById('user-name'); // Supondo que você tenha um elemento com este ID no seu HTML
    if (userNameElement) {
        userNameElement.textContent = `${userData.first_name} ${userData.last_name}`;
    }
}

/**
 * Realiza o logout do usuário, limpando os cookies no backend e os dados no localStorage.
 */
export function logout() {
    // Faz a chamada para o backend apagar os cookies httpOnly
    fetch(`${apiUrl}/api/accounts/logout/`, { method: 'POST' })
        .then(() => {
            // Limpa os dados do localStorage e redireciona para o login
            localStorage.removeItem('userData');
            window.location.href = '/src/pages/login/login.html';
        })
        .catch(error => console.error('Erro ao fazer logout:', error));
}