# Guia de Build e Execução

Este documento explica como compilar o plugin **cartalert-alerts-panel** e subir o ambiente Docker. Leia antes de rodar `docker compose up` pela primeira vez.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Como verificar |
|------------|---------------|----------------|
| Node.js    | 20            | `node -v`      |
| npm        | 10            | `npm -v`       |
| Docker     | 24            | `docker -v`    |
| Docker Compose | v2        | `docker compose version` |

Se não tiver Node 20, instale via [nvm](https://github.com/nvm-sh/nvm):
```bash
nvm install 20 && nvm use 20
```

---

## A ordem importa: compile ANTES de subir o compose

O `docker-compose.yml` faz um **bind-mount** da pasta local `./plugin/dist` para dentro do container do Grafana:

```yaml
volumes:
  - ./plugin/dist:/var/lib/grafana/plugins/cartalert-alerts-panel
```

Comportamento do Docker em bind-mount:

- Se `./plugin/dist` **não existir**, o Docker cria a pasta como **root** e vazia.
- O Grafana sobe, varre `plugins/`, encontra uma pasta vazia (sem `plugin.json`) e loga:
  ```
  Panel plugin not found: cartalert-alerts-panel
  ```
- Pior: como a pasta agora é do `root`, seu usuário não consegue mais escrever nela sem `sudo`.

**Regra**: sempre compile o plugin antes do primeiro `docker compose up`.

---

## Build do plugin

```bash
cd plugin
npm install        # instala devDeps (webpack, swc-loader, @grafana/*)
npm run build      # produz dist/
cd ..
```

Após `npm run build`, a pasta `plugin/dist/` deve conter:

```
plugin/dist/
├── module.js          # bundle principal do painel (entry: src/module.ts)
├── module.js.map      # source map (apenas em dev)
├── plugin.json        # copiado de src/plugin.json
├── README.md
└── img/
    └── logo.svg
```

Se algum desses arquivos estiver faltando, o Grafana **não** registra o plugin.

### Scripts disponíveis (`plugin/package.json`)

| Script | O que faz |
|--------|-----------|
| `npm run build`     | Build de produção (minificado, sem source maps) |
| `npm run dev`       | Build em watch mode — recompila a cada alteração de `src/` |
| `npm run typecheck` | Roda `tsc --noEmit` para validar tipos sem gerar arquivos |

Durante desenvolvimento, deixe `npm run dev` rodando em um terminal: a cada save o `dist/` é atualizado e basta dar refresh no painel do Grafana (não precisa derrubar o container).

---

## Recuperando a situação "dist vazio criado pelo Docker"

Se já rodou `docker compose up` antes de compilar:

```bash
# 1. Para a stack
docker compose down

# 2. Remove o dist vazio (foi criado pelo Docker como root)
sudo rm -rf plugin/dist

# 3. Compila o plugin
cd plugin && npm install && npm run build && cd ..

# 4. Sobe novamente
docker compose up -d
```

---

## Verificando se o Grafana carregou o plugin

```bash
# Logs do Grafana filtrando pelo id do plugin
docker logs cartalert-grafana 2>&1 | grep -i cartalert
```

Saída esperada (algo parecido):
```
logger=plugin.loader msg="Plugin registered" pluginId=cartalert-alerts-panel
```

Se aparecer:
- `Panel plugin not found` → `dist/` está vazio ou sem `plugin.json` ⇒ rebuild.
- `Plugin unsigned` (warning) → ok, é esperado em dev (env `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` já libera).
- `Plugin signature invalid` → você assinou o plugin com chave errada; remova `MANIFEST.txt` do `dist/`.

Também é possível conferir pela UI:
1. http://localhost:3000 (admin / admin)
2. Menu **Administration → Plugins**
3. Aba **Installed** → procure por *Cart Alert - Alerts Cards*

---

## Por que o id é `cartalert-alerts-panel`?

O Grafana exige que plugins não-core sigam o formato:

```
<organização>-<nome>-<tipo>
```

- `cartalert` → org/namespace
- `alerts`    → nome
- `panel`     → tipo (panel plugin)

Esse id precisa ser **idêntico** em três lugares:
1. `plugin/src/plugin.json` → campo `"id"`
2. `docker-compose.yml` → nome da pasta destino do mount e valor de `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`
3. `provisioning/dashboards/files/cart-alerts.json` → campo `"type"` do painel

Se um dos três divergir, o painel não é encontrado.

---

## Fluxo de desenvolvimento recomendado

Terminal 1 — watch do plugin:
```bash
cd plugin && npm run dev
```

Terminal 2 — stack rodando:
```bash
docker compose up   # sem -d, para ver os logs ao vivo
```

Editou um `.tsx`? O `dev` recompila o `dist/`; o Grafana serve o asset estático do volume, então basta **F5** no navegador (Ctrl+Shift+R se houver cache).

Mudou `plugin.json`, `module.ts` raiz ou `webpack.config.js`? Recarregue o Grafana:
```bash
docker compose restart grafana
```

---

## Troubleshooting rápido

| Sintoma | Causa provável | Correção |
|--------|----------------|----------|
| `Panel plugin not found: cartalert-alerts-panel` | `dist/` vazio | `npm run build` |
| `dist/` aparece como root e não consigo escrever | Bind-mount criou a pasta | `sudo rm -rf plugin/dist` e recompile |
| `npm install` falha em peer dep do `@grafana/*` | Node < 20 | `nvm use 20` |
| Plugin aparece mas card está em branco | Erro de runtime no React | Abra o DevTools (F12) → Console |
| Cards sempre "carregando..." | API `/api/prometheus/grafana/api/v1/rules` falhou | Veja Network no DevTools; confirme que o Grafana tem regras provisionadas |
| Nenhum alerta lista, mesmo com regras | `provisioning/alerting/` não foi montado ou regra com `datasourceUid` errado | `docker compose logs grafana \| grep -i alert` |
