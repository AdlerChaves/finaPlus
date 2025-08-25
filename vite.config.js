import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  
  base: './',

  build: {
    rollupOptions: {
      input: {
        // Página Principal (Dashboard)
        main: resolve(__dirname, 'index.html'),

        // Telas de Autenticação e Cadastro
        login: resolve(__dirname, 'telas/login.html'),
        cadastroAdmin: resolve(__dirname, 'telas/cadastroAdmin.html'),
        passwordReset: resolve(__dirname, 'telas/password_reset_confirm.html'),
        
        // Telas Principais da Aplicação
        clientes: resolve(__dirname, 'telas/clientes.html'),
        contas: resolve(__dirname, 'telas/contas.html'),
        contasAPagar: resolve(__dirname, 'telas/contasPagar.html'),
        contasAReceber: resolve(__dirname, 'telas/contasReceber.html'),
        fornecedores: resolve(__dirname, 'telas/fornecedores.html'),
        cadastroCartoes: resolve(__dirname, 'telas/cadastroCartoes.html'),
        cadastroCategorias: resolve(__dirname, 'telas/cadastroCategorias.html'),
        cadastroClientes: resolve(__dirname, 'telas/cadastroClientes.html'),
        cadastroFornecedores: resolve(__dirname, 'telas/cadastroFornecedores.html'),
        cadastroUsuario: resolve(__dirname, 'telas/cadastroUsuario.html'),
        configuracoes: resolve(__dirname, 'telas/configuracoes.html'),
        detalheFatura: resolve(__dirname, 'telas/detalheFatura.html'),
        DFC: resolve(__dirname, 'telas/DFC.html'),
        DRE: resolve(__dirname, 'telas/DRE.html'),
        entradas: resolve(__dirname, 'telas/entradas.html'),
        saidas: resolve(__dirname, 'telas/saidas.html'),

        // Componentes
        modalCartaoCredito: resolve(__dirname, 'componentes/modalCartaoCredito.html'),
        modalFaturaCartao: resolve(__dirname, 'componentes/modalFaturaCartao.html'),
        modalGastoCartao: resolve(__dirname, 'componentes/modalGastoCartao.html'),
        modalMarcarPago: resolve(__dirname, 'componentes/modalMarcarPago.html'),
        

      },
    },
  },
});