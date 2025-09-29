import { resolve } from 'path';
import path from 'path'
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  
  base: './',

  build: {
    rollupOptions: {
      input: {
        
        main: resolve(__dirname, 'index.html'),

        login: resolve(__dirname, 'src/pages/login/login.html'),
        cadastroAdmin: resolve(__dirname, 'src/pages/cadastros/admin/cadastroAdmin.html'),
        passwordReset: resolve(__dirname, 'src/pages/resetPassword/password_reset_confirm.html'),
        
        // Telas Principais da Aplicação
        clientes: resolve(__dirname, 'src/pages/clientes/clientes.html'),
        contas: resolve(__dirname, 'src/pages/banking/contas/contas.html'),
        contasPagar: resolve(__dirname, 'src/pages/banking/contasPagar/contasPagar.html'),
        contasReceber: resolve(__dirname, 'src/pages/banking/contasReceber/contasReceber.html'),
        fornecedores: resolve(__dirname, 'src/pages/fornecedores/fornecedores.html'),
        cadastroCartoes: resolve(__dirname, 'src/pages/cadastros/cartoes/cadastroCartoes.html'),
        cadastroCategorias: resolve(__dirname, 'src/pages/cadastros/categorias/cadastroCategorias.html'),
        cadastroClientes: resolve(__dirname, 'src/pages/cadastros/clientes/cadastroClientes.html'),
        cadastroFornecedores: resolve(__dirname, 'src/pages/cadastros/fornecedores/cadastroFornecedores.html'),
        cadastroUsuario: resolve(__dirname, 'src/pages/cadastros/usuario/cadastroUsuario.html'),
        configuracoes: resolve(__dirname, 'src/pages/configuracoes/configuracoes.html'),
        detalheFatura: resolve(__dirname, 'src/pages/banking/detalheFatura/detalheFatura.html'),
        DFC: resolve(__dirname, 'src/pages/relatorios/DFC/DFC.html'),
        DRE: resolve(__dirname, 'src/pages/relatorios/DRE/DRE.html'),
        entradas: resolve(__dirname, 'src/pages/banking/entradas/entradas.html'),
        saidas: resolve(__dirname, 'src/pages/banking/saidas/saidas.html'),

       
      },
    },
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
  },
});