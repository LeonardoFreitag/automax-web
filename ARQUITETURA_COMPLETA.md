# 🎯 Arquitetura Completa - AutoMax Chamados

## 📊 Estrutura de Rotas

```
http://localhost:3000/
├── /                           → Home (Dashboard wallpaper)
├── /novo                       → Formulário de novo chamado
├── /kanban                     → Kanban board (PROTEGIDO - autenticação)
├── /suporte/novo               → Cadastro de novo membro de suporte
└── /suporte/autoriza           → Autorização de suportes (token admin)
```

---

## 🏠 Rota: `/` (Home - Dashboard)

**O que é:** Replica exata do arquivo original `index.html` convertida em componente React

**Funcionalidade:**
- Exibido como wallpaper interativo no Delphi/EdgeBrowser
- Contém informações do sistema AutoMax
- Botões de suporte: WhatsApp, E-mail, Abrir Chamado
- **Novo:** Botão "Abrir chamado" navega para `/novo`

**Componentes:**
- `src/pages/Home.jsx`
- `src/pages/Home.css`

**Integração Delphi:**
- Via `window.chrome.webview.postMessage()` para comunicação com Edge WebView2
- Mensagens: `SUPORTE_WHATSAPP`, `SUPORTE_EMAIL`, `ABRIR_CHAMADO`

---

## 📝 Rota: `/novo` (Formulário de Novo Chamado)

**O que é:** Página completa para criar novo ticket de suporte

**Funcionalidade:**
- Formulário com 6 campos: título, descrição, email, telefone, categoria, prioridade
- Validação de email
- Integração Firebase (salva na coleção `chamados`)
- Status automático: `pendente`
- Após criar: **Redireciona para home (`/`)** após 2 segundos

**Componentes:**
- `src/pages/FormularioPage.jsx` (wrapper com navegação)
- `src/components/FormularioChamado.jsx` (formulário)
- `src/components/FormularioChamado.css`

**Dados Salvos no Firestore:**
```javascript
{
  titulo: string,
  descricao: string,
  email: string,
  telefone: string,
  categoria: string,
  prioridade: string,
  status: 'pendente',
  dataCriacao: timestamp,
  dataAtualizacao: timestamp
}
```

---

## 🎯 Rota: `/kanban` (Quadro de Chamados)

**O que é:** Kanban board com 4 colunas (Pendente → Resolvendo → Concluído → Arquivado)

**Proteção:** ⚠️ **REQUER AUTENTICAÇÃO**
- Usa `ProtectedRoute` wrapper
- Se não autenticado → redireciona para home

**Funcionalidade:**
- 4 colunas de status
- Drag-and-drop entre colunas
- Click em card para ver detalhes em modal
- Delete de chamados
- Sincronização em tempo real com Firestore

**Componentes:**
- `src/pages/KanbanPage.jsx` (wrapper com navegação)
- `src/components/Kanban.jsx` (kanban)
- `src/components/Kanban.css`

---

## 👥 Rota: `/suporte/novo` (Cadastro de Novo Suporte)

**O que é:** Formulário para novos membros de suporte se cadastrarem

**Funcionalidade:**
- Formulário: nome, email, telefone, CPF, nível de experiência
- Validação de CPF (11 dígitos)
- Salva na coleção Firestore `suportes`
- Status: `aguardando_aprovacao`
- Após enviar: Autentica como `suporte` e redireciona para home

**Componentes:**
- `src/pages/SuporteNovoPage.jsx`
- `src/pages/SuporteNovoPage.css`

**Dados Salvos no Firestore:**
```javascript
{
  nome: string,
  email: string,
  telefone: string,
  cpf: string (sem máscara),
  experiencia: 'iniciante' | 'intermediario' | 'avancado',
  status: 'aguardando_aprovacao',
  dataCadastro: timestamp
}
```

---

## 🔐 Rota: `/suporte/autoriza` (Autorização de Suportes)

**O que é:** Painel administrativo para aprovar/rejeitar novos suportes

**Proteção:** ⚠️ **REQUER TOKEN ADMIN**
- Token: `automax-admin-2026-secret` (hardcoded - mude em produção!)
- Salvo em `localStorage` como `automax_admin_token`

**Funcionalidade:**
1. Tela de autenticação com campo de token
2. Após autenticar, mostra lista de solicitações pendentes (`aguardando_aprovacao`)
3. Para cada solicitação:
   - **Aprovar** → Muda status para `aprovado`
   - **Rejeitar** → Deleta documento

**Componentes:**
- `src/pages/SuporteAutorizaPage.jsx`
- `src/pages/SuporteAutorizaPage.css`

---

## 🔑 Sistema de Autenticação

### AuthContext (`src/contexts/AuthContext.jsx`)

**Estado:**
```javascript
{
  usuarioAutenticado: boolean,
  usuarioEmail: string,
  usuarioTipo: 'cliente' | 'suporte' | 'admin',
  carregando: boolean
}
```

**Métodos:**
```javascript
autenticar(email, tipo)          // Autentica usuário
desautenticar()                  // Limpa autenticação
setarTokenAdmin(token)           // Salva token admin
obterTokenAdmin()                // Obtém token admin
```

**Armazenamento:**
- `localStorage.automax_usuario_email`
- `localStorage.automax_usuario_tipo`
- `localStorage.automax_admin_token`

### ProtectedRoute (`src/components/ProtectedRoute.jsx`)

**Uso:**
```jsx
<ProtectedRoute>
  <KanbanPage />
</ProtectedRoute>
```

- Se `usuarioAutenticado === false` → Redireciona para `/`
- Se `carregando === true` → Mostra "Carregando..."

---

## 🔥 Firestore Collections

### Collection: `chamados`
```javascript
{
  id: string (auto),
  titulo: string,
  descricao: string,
  email: string,
  telefone: string,
  categoria: string,
  prioridade: string,
  status: 'pendente' | 'resolvendo' | 'concluido' | 'arquivado',
  dataCriacao: timestamp,
  dataAtualizacao: timestamp
}
```

### Collection: `suportes`
```javascript
{
  id: string (auto),
  nome: string,
  email: string,
  telefone: string,
  cpf: string,
  experiencia: 'iniciante' | 'intermediario' | 'avancado',
  status: 'aguardando_aprovacao' | 'aprovado',
  dataCadastro: timestamp
}
```

---

## 📱 Integração com Delphi/EdgeBrowser

### Como Funciona:

1. **Delphi abre:** `http://localhost:3000/`
2. **Renderiza Home** como wallpaper interativo
3. **Usuário clica** em "Abrir Chamado"
4. **Navega para** `/novo` dentro da mesma janela
5. **Preenche formulário** e submete
6. **Redireciona para** `/` (volta ao home)

### Comunicação Delphi ↔ Web:

```javascript
// Do navegador para Delphi
window.chrome.webview.postMessage('SUPORTE_WHATSAPP');
window.chrome.webview.postMessage('SUPORTE_EMAIL');
window.chrome.webview.postMessage('ABRIR_CHAMADO');
```

---

## 🚀 Como Testar

### 1️⃣ Iniciar servidor:
```bash
npm run dev
```

### 2️⃣ Testar cada rota:

**Home:**
```
http://localhost:3000/
```
- Verificar layout
- Clicar em "Abrir chamado" → vai para `/novo`

**Novo Chamado:**
```
http://localhost:3000/novo
```
- Preencher formulário
- Submeter
- Redireciona para `/`

**Kanban (sem autenticação):**
```
http://localhost:3000/kanban
```
- Deve redirecionar para `/` (não autenticado)

**Cadastro de Suporte:**
```
http://localhost:3000/suporte/novo
```
- Preencher dados
- Submeter
- Autentica como `suporte`
- Pode agora acessar `/kanban`

**Autorização (Admin):**
```
http://localhost:3000/suporte/autoriza
```
- Token: `automax-admin-2026-secret`
- Deve mostrar lista de solicitações
- Pode aprovar/rejeitar

---

## ⚠️ Importante para Produção

1. **Token Admin:**
   - Está hardcoded como `automax-admin-2026-secret`
   - Em produção, use variável de ambiente
   - Mude para algo mais seguro

2. **Firestore Rules:**
   - Atualize para permitir apenas authenticated users em produção
   - Implemente Firebase Authentication

3. **Variáveis de Ambiente:**
   - Mude credenciais Firebase para variáveis de ambiente
   - Use `.env.local` para dados sensíveis

4. **HTTPS:**
   - Em produção, use HTTPS
   - EdgebBrowser do Delphi pode ter restrições de segurança

---

## 📝 Notas

- **Basename:** `/` em dev, `/chamados` em produção (Firebase Hosting)
- **localStorage:** Persiste autenticação entre reloads
- **Timestamps:** Firestore `serverTimestamp()` para sincronização
- **CSS:** Tema dark AutoMax (#0d1225) em todas as páginas

---

## 🎨 Design System

- **Cor Primária:** #f0b429 (Gold)
- **Cor Secundária:** #5ba3e0 (Blue)
- **Background:** #0d1225 (Dark)
- **Header:** #0a0e1c (Darker)
- **Texto Claro:** #e0eaf5
- **Texto Mudo:** #5a7fa8
