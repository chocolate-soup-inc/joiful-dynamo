module.exports = {
  root: true,
  env: {
    'jest/globals': true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json'
  },
  plugins: ['@typescript-eslint', 'jest'],
  ignorePatterns: [
    '.eslintrc.js',
    '.prettierrc.js',
    'babel.config.js',
    'jest.config.ts',
    'webpack.config.js'
  ],
  rules: {
    'max-len': ['error', { ignoreComments: true, ignoreStrings: true, code: 120 }],
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'import/prefer-default-export': 'off',
    'arrow-body-style': 'off',
    'no-continue': 'off',
    'class-methods-use-this': 'off',
    'max-classes-per-file': 'off',
    "indent": "off",
    'max-len': 'off',
    "@typescript-eslint/indent": [
      "error",
      2,
      {
        "ignoredNodes": [
          "FunctionExpression > .params[decorators.length > 0]",
          "FunctionExpression > .params > :matches(Decorator, :not(:first-child))",
          "ClassBody.body > PropertyDefinition[decorators.length > 0] > .key"
        ]
      }
    ],
    'no-prototype-builtins': 'off',
    // '@typescript-eslint/indent': ['error', 2],
  }
};
