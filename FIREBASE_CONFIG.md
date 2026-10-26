# 🔧 Guia Rápido - Configurar Firebase

## Passo 1: Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Criar projeto"**
3. Digite o nome: **AutoMax** (ou similar)
4. Desabilite Google Analytics (opcional)
5. Clique em **"Criar projeto"** e aguarde

## Passo 2: Obter Credenciais

1. No painel do Firebase, clique no ícone ⚙️ (Configurações)
2. Vá para **"Suas aplicações"** → **"Web"** (ícone `</>`)
3. Copie o código de configuração que aparecerá

Exemplo de configuração (seus valores serão diferentes):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEXAMPLE...",
  authDomain: "seu-projeto-123.firebaseapp.com",
  projectId: "seu-projeto-123",
  storageBucket: "seu-projeto-123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

## Passo 3: Configurar no Projeto

1. Abra o arquivo: `src/firebase.js`
2. Substitua os valores do `firebaseConfig` pelos seus

```javascript
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLE_SEU_APP_ID_AQUI"
};
```

3. Salve o arquivo (Ctrl+S)

## Passo 4: Ativar Firestore

1. No console do Firebase, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha a região mais próxima (ex: `us-east1`)
4. Para modo, escolha **"Modo de produção"**
5. Clique em **"Criar"**

## Passo 5: Configurar Regras de Segurança

1. No Firestore, vá para aba **"Regras"**
2. Apague o conteúdo atual
3. Cole o código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chamados/{document=**} {
      allow read, create;
      allow update, delete: if request.auth != null;
    }
  }
}
```

4. Clique em **"Publicar"**

## Passo 6: Testar Localmente

```bash
# No terminal, na pasta do projeto
npm install --legacy-peer-deps
npm run dev
```

Abra http://localhost:3000 no navegador

## Passo 7: Deploy

Quando estiver pronto para publicar:

```bash
# Build para produção
npm run build

# Deploy no Firebase
firebase deploy
```

## ✅ Pronto!

Sua aplicação estará em:
- **Dashboard**: https://seu-projeto-123.web.app/
- **Sistema de Chamados**: https://seu-projeto-123.web.app/chamados

---

## ❓ Troubleshooting

### Erro: "Permission denied"
→ Certifique-se que as regras do Firestore estão publicadas corretamente

### Erro: "Cannot read property 'apiKey'"
→ Verifique se as credenciais em `src/firebase.js` estão corretas

### Nenhum dado aparece no Firestore
→ Tente criar um chamado manualmente pela interface

### Erro ao fazer deploy
```bash
# Verifique se está logado
firebase login

# Tente novamente
firebase deploy
```

---

**Precisa de ajuda?** Consulte a [documentação do Firebase](https://firebase.google.com/docs)
