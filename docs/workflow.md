# docs/workflow.md — Auto-Fix and Ship

## 3-Step Loop

1. **Edit** — Make your changes
2. **Check** — `npm run check` (typecheck + lint + build)
3. **Ship** — Commit and push

```bash
npm run check
# If pass:
git add -A
git commit -m "fix: <short description>"
git push origin main
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Local dev server (localhost:3000) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build` | Next.js production build |
| `npm run check` | typecheck + lint + build |
| `npm run ship` | Runs check, then shows git status + diff + commit instructions |

## Troubleshooting

### Missing dev script
If `npm run dev` fails, ensure you are in the project root (directory containing `package.json`). Run:
```bash
npm install
npm run dev
```

### gh auth login (GitHub CLI)
If `git push` fails with credential errors:
```bash
gh auth login -h github.com -p https -w
# Follow: GitHub.com → HTTPS → Login with web browser
```

Then configure Git to use gh:
```bash
git config --global credential.helper '!gh auth git-credential'
git config --global credential.useHttpPath true
```

### Switching remote: HTTPS vs SSH
**Current remote:**
```bash
git remote -v
```

**Switch to HTTPS:**
```bash
git remote set-url origin https://github.com/zalziadi/taamun-mvp.git
```

**Switch to SSH:**
```bash
git remote set-url origin git@github.com:zalziadi/taamun-mvp.git
# Requires SSH key added to GitHub → Settings → SSH Keys
```

### Auto-fix lint issues
If lint fails, try:
```bash
npm run lint -- --fix
```
