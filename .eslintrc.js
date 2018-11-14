module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    parserOptions: {
        sourceType: 'module',
        parser: 'babel-eslint'
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    plugins: ['prettier'],
    rules: {
        semi: [2, 'never'],
        'no-console': 'off',
        'prettier/prettier': [
            'error',
            {
                semi: false,
                useTabs: false,
                tabWidth: 4,
                printWidth: 100,
                singleQuote: true,
                arrowParens: 'always'
            }
        ]
    }
}
