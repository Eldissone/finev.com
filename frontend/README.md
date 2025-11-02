###Frontend (static)

O frontend é composto por páginas estáticas em `frontend/pages` e assets em `frontend/css`, `frontend/js`, `frontend/assets`.

Para servir localmente (PowerShell):

```powershell
cd C:\Users\Evilonga\FIN\frontend
npm install
npm run dev
```

O comando `npm run dev` usa `npx http-server` para servir o diretório na porta 3000. Abra http://localhost:3000/pages/index.html
