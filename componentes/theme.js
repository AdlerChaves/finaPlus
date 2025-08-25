function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem('financaplus-theme');
    // Se o utilizador já tiver uma preferência guardada no browser, use-a.
    if (savedTheme) {
        return savedTheme;
    }
    // Caso contrário, use a preferência do sistema operativo (claro ou escuro).
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Aplica o tema inicial assim que o script é carregado
applyTheme(getInitialTheme());