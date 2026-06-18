You are in the **barretoigor2025/salary-tracker-3** repository (currently empty).

Your task: populate it with the complete Salary Tracker 3 source code.

---

## Step 1 — Add the source repo to this session

Use `mcp__claude-code-remote__list_repos` (load via ToolSearch first), then `add_repo` to add `barretoigor2025/japansalarytracker-` to this session's scope.

---

## Step 2 — Read and write all 34 source files

Read each file below from **repo: `barretoigor2025/japansalarytracker-`, branch: `salary-tracker-3`** using `mcp__github__get_file_contents`, then write it to the local filesystem at the same path.

Do them in batches of 6 in parallel. Files:

1. `.github/workflows/deploy.yml`
2. `.gitignore`
3. `index.html`
4. `package.json`
5. `postcss.config.js`
6. `tailwind.config.js`
7. `vite.config.js`
8. `eslint.config.js`
9. `public/favicon.svg`
10. `src/main.jsx`
11. `src/index.css`
12. `src/App.jsx`
13. `src/db/db.js`
14. `src/hooks/useEntries.js`
15. `src/hooks/useSettings.js`
16. `src/hooks/useGastos.js`
17. `src/hooks/useCarro.js`
18. `src/hooks/useAudit.js`
19. `src/utils/fmt.js`
20. `src/utils/calc.js`
21. `src/utils/yukyu.js`
22. `src/utils/backup.js`
23. `src/components/ui.jsx`
24. `src/components/EntryForm.jsx`
25. `src/components/CalcDetailModal.jsx`
26. `src/components/TeateSection.jsx`
27. `src/components/YukyuModal.jsx`
28. `src/components/BackupModal.jsx`
29. `src/screens/Dashboard.jsx`
30. `src/screens/Entries.jsx`
31. `src/screens/Reports.jsx`
32. `src/screens/Gastos.jsx`
33. `src/screens/Carro.jsx`
34. `src/screens/Settings.jsx`

---

## Step 3 — Install, commit, and push

```bash
npm install
git add -A
git commit -m "feat: initial Salary Tracker 3 — React 19 + Vite 8 + IndexedDB"
git push -u origin main
```

---

## Step 4 — Enable GitHub Pages (tell user)

After pushing, tell the user to go to:
**https://github.com/barretoigor2025/salary-tracker-3/settings/pages**
→ Source: **GitHub Actions**
→ Save

The app will be live at **https://barretoigor2025.github.io/salary-tracker-3/**
