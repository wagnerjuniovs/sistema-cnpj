# Sistema CNPJ — frontend

Site: https://wagnerjuniovs.github.io/sistema-cnpj/

O site usa a API em http://127.0.0.1:3333 no mesmo computador em que o SSD CNPJ_DADOS estiver conectado. API e PostgreSQL permanecem no SSD; este repositório contém apenas o frontend. Não há túnel, API pública ou dados fictícios.

Em cada computador Windows compatível, execute uma vez CONFIGURAR_ESTE_COMPUTADOR.cmd na raiz do SSD. O monitor instalado na sessão do usuário detecta o SSD e inicia os serviços. Depois, conecte o SSD e abra o site. Permita o acesso à rede local quando o navegador solicitar. O site não pode iniciar programas do Windows sozinho.

O monitor verifica a presença do SSD a cada 5 segundos. Se o site abrir antes da API, ele tenta reconectar automaticamente. INICIAR_CNPJ.cmd permite iniciar manualmente. Antes de remover o SSD, encerre o banco com PARAR_CNPJ.cmd e ejete a unidade pelo Windows.

A configuração foi validada no computador de desenvolvimento. Outro computador pode precisar de permissão de acesso aos arquivos do SSD e do runtime Microsoft Visual C++; a configuração informa falhas sem alterar ou reinicializar a base. Celulares não executam esta API Windows.

## Desenvolvimento e publicação

Node.js 24, npm ci, npm run dev. Use VITE_API_URL no .env.local privado. Variáveis VITE_ são públicas: nunca inclua senhas.

O workflow publica somente dist na branch main. VITE_API_URL é uma variável do repositório, atualmente http://127.0.0.1:3333. O build Pages ignora arquivos .env locais e usa /sistema-cnpj/. Execute npm run build:pages e npm test para validar. O endereço loopback acima é autorizado explicitamente; demais endereços loopback, credenciais e mocks são rejeitados na auditoria.
