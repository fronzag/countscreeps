# countscreeps

Bot Screeps **Colony OS v3.2** — single room, estável.

## Como o Screeps funciona

O jogo usa **vários arquivos `.js`** na pasta de scripts, ligados por `require()`.
Só o `main.js` é especial: é nele que fica `module.exports.loop`, o entry point de cada tick.

Não precisa bundler. O deploy copia `src/` direto para a pasta do cliente.

## Estrutura

```
src/
├── main.js           entry point (module.exports.loop)
├── config.js
├── spawnManager.js
├── creepActions.js
├── planner.js
├── memory.js
├── status.js
└── roles/
    ├── harvester.js
    ├── upgrader.js
    └── builder.js
```

## Comandos

```powershell
powershell -File scripts/deploy.ps1   # copia src/ para a pasta do Screeps
powershell -File scripts/push.ps1     # alias do deploy
```

## Deploy

Copia todos os `.js` de `src/` para:

```
C:\Users\guilh\AppData\Local\Screeps\scripts\screeps_newbieland_net___21025\default\
```

O cliente Steam detecta a mudança e sincroniza com o servidor.

## Fluxo de trabalho

1. Edite arquivos em `src/`
2. `powershell -File scripts/push.ps1`
3. `git commit` para salvar a versão

## GitHub

```powershell
git remote add origin https://github.com/fronzag/countscreeps.git
git add -A
git commit -m "Initial commit: Colony OS v3.2 modular"
git push -u origin main
```
