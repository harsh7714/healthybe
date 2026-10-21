const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  { ignores: ['node_modules/**', 'uploads/**', 'dist/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.commonjs },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]
