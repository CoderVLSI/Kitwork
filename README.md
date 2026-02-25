# 🧰 Kitwork

**Your own Git.** A complete version control system with a CLI, server API, and web interface.

## Features

- 🔧 **Core VCS Engine** — SHA-256 content-addressable storage, branches, merging
- 💻 **CLI** — `kit init`, `kit add`, `kit commit`, `kit push`, `kit pull`, `kit clone`
- 🌐 **Web Platform** — GitHub-like interface to browse repos, commits, and files
- 🔐 **Auth** — JWT-based user authentication

## Quick Start

```bash
# Install the CLI globally
npm install -g kitwork

# Initialize a new repo
kit init

# Stage and commit
kit add .
kit commit -m "first commit"

# Push to Kitwork server
kit remote add origin http://localhost:4000/username/my-repo
kit push origin main
```

## Project Structure

```
kitwork/
├── packages/
│   ├── kit-core/     # VCS engine
│   ├── kit-cli/      # CLI tool
│   ├── kit-server/   # Express API
│   └── kit-web/      # Next.js website
└── package.json      # Monorepo root
```

## License

MIT
