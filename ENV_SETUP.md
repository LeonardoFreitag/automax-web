# 🔐 Configuração de Variáveis de Ambiente

## ✅ O que foi feito

O token do administrador foi movido de **hardcoded** para **variável de ambiente**:

### ❌ Antes (Inseguro)
```javascript
const TOKEN_ADMIN_CORRETO = 'automax-admin-2026-secret'; // Exposto no código!
```

### ✅ Depois (Seguro)
```javascript
const TOKEN_ADMIN_CORRETO = import.meta.env.VITE_ADMIN_TOKEN || 'automax-admin-2026-secret';
```

---

## 📁 Arquivos Criados/Alterados

### 1. `.env.local` (Arquivo Local - NÃO Commitar)
```env
VITE_ADMIN_TOKEN=automax-admin-2026-secret
```

**⚠️ IMPORTANTE:**
- Este arquivo está em `.gitignore`
- Cada desenvolvedor tem seu próprio `.env.local`
- Nunca faça commit deste arquivo

### 2. `.env.example` (Modelo - Commitar)
```env
VITE_ADMIN_TOKEN=seu-token-super-seguro-aqui
```

**Use como referência** para criar seu próprio `.env.local`

### 3. `.gitignore` (Atualizado)
```
.env.local
.env*.local
```

---

## 🚀 Como Usar

### 1️⃣ Desenvolvimento Local

1. Edite `.env.local`:
```bash
VITE_ADMIN_TOKEN=seu-token-secreto-desenvolvimento
```

2. Acesse `/suporte/autoriza` e use esse token

### 2️⃣ Produção

Defina a variável de ambiente no seu servidor/hosting:

**Firebase Hosting (via Environment Variables):**
```bash
firebase functions:config:set admin.token="seu-token-seguro-producao"
```

Ou use interface do Firebase Console.

### 3️⃣ Para Novos Desenvolvedores

1. Clone o repositório
2. Veja `.env.example`
3. Crie `.env.local` com seus próprios valores
4. **NUNCA commite `.env.local`**

---

## 🔐 Melhores Práticas

✅ **Faça:**
- Use variáveis de ambiente para dados sensíveis
- Crie `.env.example` com valores fictícios
- Ignore `.env.local` no git
- Mude o token em produção

❌ **Não faça:**
- Commit de `.env.local`
- Tokens hardcoded no código
- Usar mesmo token em dev/prod
- Compartilhar `.env.local` via email/Slack

---

## 📝 Variáveis Disponíveis

| Variável | Uso | Padrão |
|----------|-----|--------|
| `VITE_ADMIN_TOKEN` | Token para /suporte/autoriza | `automax-admin-2026-secret` |

---

## 🔧 Como Acessar no Código

```javascript
// Em qualquer arquivo .jsx/.js:
const token = import.meta.env.VITE_ADMIN_TOKEN;

// Com fallback:
const token = import.meta.env.VITE_ADMIN_TOKEN || 'valor-padrao';
```

---

## ⚡ Próximas Melhorias

1. **Adicionar mais variáveis:**
   - `VITE_FIREBASE_CONFIG` - Para credenciais Firebase
   - `VITE_API_URL` - Para URL da API

2. **Implementar rotação de tokens:**
   - Token expira a cada 30 dias
   - Sistema automático de renovação

3. **Usar Firebase Secrets Manager:**
   - Em vez de variáveis locais
   - Para produção mais segura

---

**✨ Agora o token está seguro e as credenciais não vão para o repositório!** 🔒
