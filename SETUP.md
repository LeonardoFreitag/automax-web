# AutoMax - Sistema de Chamados

Este é um projeto integrado que combina um dashboard estático (para o Delphi via EdgeBrowser) com um sistema React de gerenciamento de chamados.

## 📁 Estrutura do Projeto

```
automax-web/
├── public/                    # Arquivos servidos pelo Firebase Hosting
│   ├── index.html            # Dashboard original (Delphi)
│   ├── assets/               # Imagens e recursos
│   ├── splash/               # Tela de splash
│   └── chamados/             # App React compilado
├── src/                      # Código source do React
│   ├── components/           # Componentes React
│   │   ├── FormularioChamado.jsx
│   │   ├── Kanban.jsx
│   │   └── *.css
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── Dashboard.css
│   ├── App.jsx
│   ├── App.css
│   ├── firebase.js           # Configuração Firebase
│   └── main.jsx
├── chamados/
│   └── index.html            # Entrada da app React
├── vite.config.js            # Configuração do Vite
├── firebase.json             # Configuração Firebase Hosting
└── package.json
```

## 🚀 Instalação e Setup

### 1. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

### 2. Configurar Firebase

#### a) Criar projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto chamado "AutoMax" (ou similar)
3. Ative o Firestore Database
4. Copie as credenciais

#### b) Adicionar credenciais do Firebase

Abra `src/firebase.js` e adicione suas credenciais:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### c) Configurar Firestore

Na console do Firebase, crie uma coleção chamada `chamados` com as seguintes regras de segurança:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Todos podem ler e criar chamados
    match /chamados/{document=**} {
      allow read, create;
      allow update, delete: if request.auth != null;
    }
  }
}
```

### 3. Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.local` na raiz do projeto:

```
VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
```

## 🛠️ Desenvolvimento

### Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` para ver a app React de chamados.

### Build para Produção

```bash
npm run build
```

Isto irá:
1. Compilar a app React para `public/chamados/`
2. Copiar arquivos estáticos para `public/`

## 📤 Deploy

### Deploy no Firebase Hosting

```bash
# Autenticação (primeira vez)
firebase login

# Deploy
firebase deploy
```

A aplicação estará disponível em:
- Dashboard: `https://seu-projeto.web.app/`
- Sistema de Chamados: `https://seu-projeto.web.app/chamados`

## 📋 Estrutura do Firestore

### Coleção: `chamados`

Cada documento contém:

```javascript
{
  titulo: string,              // Título do chamado
  descricao: string,           // Descrição detalhada
  email: string,               // Email do cliente
  telefone: string,            // Telefone (opcional)
  categoria: string,           // geral, nfe, pdv, financeiro, estoque, relatorios, outro
  prioridade: string,          // baixa, normal, alta, critica
  status: string,              // pendente, resolvendo, concluido, arquivado
  dataCriacao: timestamp,      // Data/hora de criação
  dataAtualizacao: timestamp   // Data/hora da última atualização
}
```

## 🎨 Componentes React

### FormularioChamado
- Formulário para criar novos chamados
- Validação de campos
- Integração com Firestore
- Feedback de sucesso/erro

### Kanban
- Visualização em quadro com 4 colunas
- Drag & drop para mover chamados entre status
- Modal para ver detalhes do chamado
- Opção de deletar chamados

### Dashboard
- Abas para alternar entre formulário e kanban
- Layout responsivo

## 🔒 Segurança

- As credenciais do Firebase estão em `src/firebase.js` (adicionar ao `.gitignore` se usar)
- Considere usar Auth do Firebase para restringir acesso
- Configure regras do Firestore adequadamente

## 🐛 Troubleshooting

### Erro: "Cannot find module 'firebase'"
```bash
npm install firebase --legacy-peer-deps
```

### Erro ao compilar CSS
- Certifique-se que todos os arquivos `.css` existem

### Firebase não conecta
- Verifique as credenciais em `src/firebase.js`
- Certifique-se que o Firestore está ativado no console

## 📱 Responsividade

- Suporta desktop
- Interface adaptável para tablets
- Mobile é suportado mas otimizado para desktop

## 🔄 Próximas Melhorias

- [ ] Autenticação de usuários
- [ ] Notificações em tempo real
- [ ] Upload de anexos
- [ ] Histórico de mudanças
- [ ] Atribuição de técnicos
- [ ] SLA tracking
- [ ] Integração com email
- [ ] Geração de relatórios

## 📞 Suporte

Para dúvidas sobre a configuração, consulte:
- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

---

**Versão:** 23.2.6  
**Última atualização:** 03/05/2026
