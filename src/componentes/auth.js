const apiUrl = import.meta.env.VITE_API_URL;

// Função para buscar os dados do usuário com autenticação
export async function fetchWithAuth() {
    try {
        const response = await fetch(`${apiUrl}/api/accounts/me/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('userData', JSON.stringify(data));
            return data;
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

// Função para proteger a página
export async function protectPage(requiredPermission) {
    let userData = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
        userData = await fetchWithAuth();
    }

    // --- CORREÇÃO PRINCIPAL AQUI ---
    if (!userData) {
        // Redireciona para o caminho completo da página de login
        window.location.href = '/src/pages/login/login.html';
        return; 
    }

    if (!userData.permissions_list || !userData.permissions_list.includes(requiredPermission)) {
        console.warn(`Acesso negado. Permissão necessária: ${requiredPermission}`);
        // Redireciona para a página inicial em caso de falta de permissão
        window.location.href = '/index.html'; 
        return;
    }

    // Se o usuário está autenticado e tem permissão, atualiza o nome no display se existir
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = `${userData.first_name} ${userData.last_name}`;
    }
}