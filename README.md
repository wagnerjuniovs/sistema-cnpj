# Sistema CNPJ — frontend

Interface React, TypeScript e Vite para explorar empresas e consultar CNPJ.

Site: https://wagnerjuniovs.github.io/sistema-cnpj/

**FRONTEND_PUBLICADO_API_REMOTA_PENDENTE**

Este repositório contém somente o frontend. A API e o PostgreSQL permanecem no SSD do proprietário. Nenhum backend, banco, conjunto de dados da Receita, credencial, evidência local ou arquivo de ambiente integra esta publicação.

Sem URL de API configurada, o site apresenta as abas e uma mensagem de consultas indisponíveis. Não exibe empresas fictícias nem tenta acessar localhost do visitante. As buscas públicas dependem de uma conexão HTTPS segura com a API; esta publicação não cria túnel, abre portas ou expõe serviços.

## Desenvolvimento

Use Node.js 24 e `npm ci`. Configure `VITE_API_URL` em um `.env.local` privado para a API acessível no seu ambiente e execute `npm run dev`. Variáveis `VITE_` são públicas: nunca coloque senhas ou tokens nelas.

## Publicação

Push na branch `main` executa o workflow de build, checagem e publicação no GitHub Pages. Somente `dist` entra no artefato do site; `dist` não é versionado. As actions oficiais estão fixadas por commit e as permissões de publicação ficam restritas ao job de deploy.

`npm run build:pages` usa `/sistema-cnpj/`, ignora arquivos `.env` locais e recebe somente `VITE_API_URL` do ambiente de build. No GitHub, use a variável de repositório `VITE_API_URL` quando existir uma API HTTPS segura, sem credenciais na URL. Depois, execute novamente o workflow. Nenhuma API pública está configurada nesta entrega.

Para validar o artefato: `npm run build:pages` e `npm test`. O teste verifica os caminhos de assets e impede endereços loopback, credenciais reconhecíveis, source maps e marcadores de dados demonstrativos no bundle. A navegação usa hashes (`#consultar`), preservando a subpasta do Pages.

Referências: [Vite 6 — GitHub Pages](https://v6.vite.dev/guide/static-deploy#github-pages) e [workflows de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
