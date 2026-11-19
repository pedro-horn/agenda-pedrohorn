# Assessor · Horn Films

Agenda, jobs e entregas do Pedro Horn, num app web que funciona no computador e no celular,
instalável na tela inicial. Não depende do Claude e não consome uso nenhum.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro (visual, agenda, entregas) |
| `config.js` | Onde você cola a configuração do Firebase |
| `manifest.webmanifest` + `icons/` | Deixam instalar como app com o ícone HORN |
| `sw.js` | Faz o app abrir rápido e funcionar offline |
| `firestore.rules` | Regras de segurança do banco (cada conta só vê os próprios dados) |
| `backup-assessor-2026-11-19.json` | Tudo que já estava cadastrado na versão do Claude, para importar |

> Dica: **não** suba o arquivo de backup no repositório se ele for público — guarde só no seu computador.

---

## 1. Subir no GitHub

1. Crie um repositório novo (ex.: `assessor`). Pode ser **privado**.
2. **Add file → Upload files** e arraste: `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, `firestore.rules`, `README.md` e a pasta `icons`.
3. **Commit changes**.

## 2. Publicar o site (escolha um)

**Cloudflare Pages** (mesmo esquema da Central SECOM, funciona com repositório privado)
1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Escolha o repositório. Framework: **None**. Build command: vazio. Output directory: `/`.
3. **Save and Deploy**. O endereço fica algo como `https://assessor.pages.dev`.

**GitHub Pages** (repositório precisa ser público no plano grátis)
1. No repositório: **Settings → Pages → Branch: main / root → Save**.
2. Endereço: `https://SEU-USUARIO.github.io/assessor/`.

Neste ponto o app já abre em **modo local** (os dados ficam só no aparelho).

## 3. Sincronizar celular + computador (Firebase, grátis)

1. console.firebase.google.com → **Adicionar projeto** (ex.: `assessor-horn`). Pode desligar o Analytics.
2. **Build → Authentication → Começar → Google → Ativar** → salve.
3. Em **Authentication → Settings → Authorized domains**, adicione o endereço do seu site
   (ex.: `assessor.pages.dev` ou `seu-usuario.github.io`).
4. **Build → Firestore Database → Criar banco** (modo produção, região `southamerica-east1`).
5. Na aba **Regras**, apague tudo, cole o conteúdo de `firestore.rules` e **Publicar**.
6. **Configurações do projeto (engrenagem) → Seus apps → `</>` Web** → registre o app →
   copie o objeto `firebaseConfig`.
7. Abra `config.js` no GitHub (ícone de lápis), troque `firebase: null` pelo objeto copiado e,
   se quiser travar no seu e-mail, preencha `allowedEmails: ["seu-email@gmail.com"]`. Commit.
8. Espere o site atualizar (1–2 min), abra e toque em **Entrar com o Google**.

## 4. Trazer os dados antigos

No app: **engrenagem (Ajustes) → Importar backup** → escolha `backup-assessor-2026-11-19.json`.
Faça isso uma vez, já logado.

## 5. Instalar no celular

- **iPhone (Safari):** abra o site → Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** ⋮ → **Instalar app** / **Adicionar à tela inicial**.

## 6. Lembretes no celular (sem custo)

Toque num job ou compromisso com data → **Google Agenda** ou **Calendário iPhone**.
O evento entra no seu calendário com alerta **1 dia antes e 1 hora antes**, e quem avisa é o próprio celular.

## Personalizar clientes

No `index.html`, procure `const CLIENTS = [` e edite a lista (nome, agência).

## O que ficou de fora em relação à versão do Claude

- A barra "escreva do seu jeito" e o "Resumo do dia" (dependiam do Claude).
- O resumo automático das 7h é uma tarefa do Claude — desligue lá se não quiser mais o consumo.
