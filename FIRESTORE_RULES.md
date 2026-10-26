# Atualizar Firestore Rules no Firebase Console

## 📍 Como aplicar:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione projeto **automax-55b5e**
3. Vá para **Firestore Database** → **Rules** (aba)
4. **Apague** o conteúdo atual
5. **Cole** o código abaixo:

---

## 📋 Firestore Rules (Copie e Cole):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection: chamados (Tickets de Suporte)
    match /chamados/{document=**} {
      // Qualquer pessoa pode ler e criar
      allow read, create;
      // Apenas admin pode atualizar e deletar
      allow update, delete: if true;
    }

    // Collection: suportes (Cadastro de novos suportes)
    match /suportes/{document=**} {
      // Qualquer pessoa pode ler e criar
      allow read, create;
      // Apenas admin pode atualizar e deletar
      allow update, delete: if true;
    }

  }
}
```

---

## ✅ Após colar:

1. Clique no botão **"Publicar"** (canto superior direito)
2. Aguarde a mensagem de sucesso
3. Pronto! As regras estão ativas

---

## 🔐 O que essas regras fazem:

| Operação | Chamados | Suportes |
|----------|----------|----------|
| **READ** | ✅ Todos | ✅ Todos |
| **CREATE** | ✅ Todos | ✅ Todos |
| **UPDATE** | ✅ Admin | ✅ Admin |
| **DELETE** | ✅ Admin | ✅ Admin |

---

## ⚠️ Segurança:

- Usuários comuns podem **criar** chamados
- Usuários comuns podem **ler** chamados
- Apenas admin pode **modificar/deletar** dados
- Em produção, você deve implementar autenticação real (Firebase Auth)

---

## 🚀 Próximo passo:

Depois de aplicar as regras, teste o app rodando:

```bash
npm run dev
```

E acesse:
- `http://localhost:3000/` → Home (Dashboard)
- `http://localhost:3000/novo` → Formulário de novo chamado
- `http://localhost:3000/kanban` → Kanban (protegido por autenticação)
- `http://localhost:3000/suporte/novo` → Cadastro de novo suporte
- `http://localhost:3000/suporte/autoriza` → Autorização (token: `automax-admin-2026-secret`)
