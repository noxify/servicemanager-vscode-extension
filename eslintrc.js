module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/class-name-casing": "warn",
        "curly": "warn",
        "no-throw-literal": "warn",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "no-duplicate-variable": true,
                    "no-unused-expression": true,
                    "semicolon": [
                        true,
                        "always"
                    ],
                    "triple-equals": true
                }
            }
        ]
    }
};
