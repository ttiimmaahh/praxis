import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // These newer react-hooks rules flag common patterns (ref sync in render, setState in async effects)
      // that are idiomatic in this codebase. Keep as warnings to surface for review without blocking CI.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  prettier,
  {
    ignores: [
      'out/**',
      'release/**',
      'node_modules/**',
      'scripts/**',
      // shadcn/Plate-generated UI components
      'src/renderer/components/ui/**'
    ]
  }
)
