# 🎯 Integração com Dashboard Delphi

## Como adicionar link para o Sistema de Chamados

No seu `index.html` atual (dashboard do Delphi), você pode adicionar um botão que redireciona para o sistema de chamados.

### Opção 1: Adicionar na seção de suporte

Edite o arquivo `public/index.html` e procure pela seção de suporte. Substitua:

```html
<button class="btn-suporte btn-chamado" onclick="abrirChamado()">
  🎧 Abrir chamado
</button>
```

Por:

```html
<button class="btn-suporte btn-chamado" onclick="abrirSistemaChamados()">
  🎧 Abrir chamado (Novo)
</button>
```

E no `<script>`, substitua a função `abrirChamado()`:

```javascript
function abrirSistemaChamados() {
  // Se em um app Electron/WebView, notifique o backend
  try {
    window.chrome.webview.postMessage('ABRIR_SISTEMA_CHAMADOS');
  } catch(e) {
    // Browser normal - redireciona
  }
  
  // Abre em nova aba
  window.open('/chamados', '_blank');
  // Ou redireciona na mesma página:
  // window.location.href = '/chamados';
}
```

### Opção 2: Adicionar um botão na topbar

Edite a topbar para adicionar um novo botão:

```html
<div class="topbar">
  <div class="topbar-logo">
    <!-- seu logo aqui -->
  </div>
  
  <!-- Novo botão -->
  <button 
    onclick="window.open('/chamados', '_blank')" 
    style="
      background: linear-gradient(135deg, #f0b429, #ffcc66);
      color: #0d1225;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      margin-left: auto;
    "
  >
    📞 Chamados
  </button>
  
  <span class="topbar-version">v 23.2.6</span>
</div>
```

## Como funciona

- **Dashboard Original** (`/`): Continua funcionando normalmente para o Delphi via EdgeBrowser
- **Sistema de Chamados** (`/chamados`): Nova interface React

Os dois compartilham o **mesmo banco de dados Firestore**, então:
- Um chamado criado no formulário aparece automaticamente no kanban
- Você pode gerenciar tudo de um só lugar

## Estrutura de URLs

```
https://seu-dominio.com/
  ├── /                      → Dashboard original (Delphi)
  ├── /assets/               → Imagens e recursos
  ├── /splash/               → Tela de splash
  └── /chamados              → Sistema React de chamados
      └── /chamados/assets/  → Assets da app React
```

## Integração com Delphi

Se quiser notificar o Delphi quando um chamado for criado:

```javascript
function enviarDelphi(msg) {
  try {
    window.chrome.webview.postMessage(msg);
  } catch(e) {
    // Fora do Delphi
  }
}

// Nos componentes React, após criar um chamado:
enviarDelphi('CHAMADO_CRIADO');
enviarDelphi('ATUALIZAR_LISTA_CHAMADOS');
```

## Build e Deploy

Cada vez que você modificar o código React:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy
```

Os arquivos estáticos do dashboard original continuam intactos!

---

**Mais dúvidas?** Consulte o arquivo `SETUP.md`
