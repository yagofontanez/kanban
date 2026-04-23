# Kanban

> Um lugar calmo para organizar o seu trabalho.

Um kanban minimalista, opinativo e offline-first para gerenciar projetos pessoais. Feito para ser leve, bonito e funcionar direto do navegador — sem cadastro, sem servidor, sem ruído.

## ✨ Funcionalidades

- 📋 **Múltiplos projetos** com emoji, colunas customizáveis e paleta de cores suave
- 🧲 **Drag & drop** de cards e colunas (via [`@dnd-kit`](https://dndkit.com/))
- 🏷️ **Labels coloridas**, prioridades, datas de entrega e checklists
- 💬 **Comentários, links e histórico de atividades** por card
- 📱 **PWA** — instala no desktop e no mobile, funciona offline
- 💾 **Persistência local** — seus dados ficam no navegador, sem nuvem
- 🎨 **Design calmo** em tons neutros com tipografia em Inter + Instrument Serif

## 🛠️ Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) para estado global
- [@dnd-kit](https://dndkit.com/) para drag & drop
- [Lucide](https://lucide.dev/) para ícones

## 🚀 Começando

Pré-requisitos: **Node.js 18+** e **npm**.

```bash
# instale as dependências
npm install

# rode em modo de desenvolvimento
npm run dev

# gere o build de produção
npm run build

# pré-visualize o build
npm run preview
```

O app abre em `http://localhost:5173`.

## 📁 Estrutura

```
src/
├── components/   # Board, Column, Card, CardModal, Sidebar, Popover...
├── store/        # Zustand store (useStore)
├── lib/          # utilitários (uid, seed de dados iniciais)
├── types.ts      # tipos do domínio (Project, Column, Card, Label...)
├── App.tsx
├── main.tsx
└── index.css
```

## 📝 Licença

Projeto pessoal — use, modifique e compartilhe à vontade.
