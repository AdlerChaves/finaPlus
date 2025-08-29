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
        login: resolve(__dirname, 'src/pages/login/login.html'),
        cadastroAdmin: resolve(__dirname, 'src/pages/cadastros/admin/cadastroAdmin.html'),
        passwordReset: resolve(__dirname, 'src/pages/resetPassword/password_reset_confirm.html'),
        
        // Telas Principais da Aplicação
        clientes: resolve(__dirname, 'src/pages/clientes/clientes.html'),
        contas: resolve(__dirname, 'src/pages/banking/contas/contas.html'),
        contasAPagar: resolve(__dirname, 'src/pages/banking/contasPagar/contasPagar.html'),
        contasAReceber: resolve(__dirname, 'src/pages/banking/contasReceber/contasReceber.html'),
        fornecedores: resolve(__dirname, 'src/pages/fornecedores/fornecedores.html'),
        cadastroCartoes: resolve(__dirname, 'src/pages/cadastros/cartoes/cadastroCartoes.html'),
        cadastroCategorias: resolve(__dirname, 'src/pages/cadastros/categorias/cadastroCategorias.html'),
        cadastroClientes: resolve(__dirname, 'src/pages/cadastros/clientes/cadastroClientes.html'),
        cadastroFornecedores: resolve(__dirname, 'src/pages/cadastros/fornecedores/cadastroFornecedores.html'),
        cadastroUsuario: resolve(__dirname, 'src/pages/cadastros/usuario/cadastroUsuario.html'),
        configuracoes: resolve(__dirname, 'src/pages/configuracoes/configuracoes.html'),
        detalheFatura: resolve(__dirname, 'src/pages/banking/detalhes/detalheFatura/detalheFatura.html'),
        DFC: resolve(__dirname, 'src/pages/relatorios/DFC/DFC.html'),
        DRE: resolve(__dirname, 'src/pages/relatorios/DRE/DRE.html'),
        entradas: resolve(__dirname, 'src/pages/banking/entradas/entradas.html'),
        saidas: resolve(__dirname, 'src/pages/banking/saidas/saidas.html'),

        // Componentes
        modalCartaoCredito: resolve(__dirname, 'src/componentes/modalCartaoCredito/modalCartaoCredito.html'),
        modalFaturaCartao: resolve(__dirname, 'src/componentes/modalFaturaCartao/modalFaturaCartao.html'),
        modalGastoCartao: resolve(__dirname, 'src/componentes/modalGastoCartao/modalGastoCartao.html'),
        modalMarcarPago: resolve(__dirname, 'src/componentes/modalMarcarPago/modalMarcarPago.html'),
        

      },
    },
  },
});