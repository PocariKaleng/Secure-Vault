import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolveBasePath(): string {
  if (process.env.GITHUB_PAGES !== 'true') return '/'

  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required for a GitHub Pages build.')
  }

  const repositoryName = repository.split('/').at(-1)
  if (!repositoryName || !/^[A-Za-z0-9._-]+$/.test(repositoryName)) {
    throw new Error('GITHUB_REPOSITORY contains an invalid repository name.')
  }

  return repositoryName.toLowerCase().endsWith('.github.io')
    ? '/'
    : `/${repositoryName}/`
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
})
