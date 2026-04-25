import js from '@eslint/js'
import globals from 'globals'
import reactX from 'eslint-plugin-react-x'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'routeTree.gen.ts',
      'build/**',
      '.next/**',
      '**/.wrangler/**',
      'package-lock.json',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-x': reactX,
    },
    rules: {
      ...reactX.configs.recommended.rules,
      // The setter-name check is noisy for hooks that intentionally wrap internal setters.
      'react-x/use-state': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  }
)
