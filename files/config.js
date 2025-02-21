export default {
    "tsconfig.json": `{
        "compilerOptions": {
            "target": "es5",
            "lib": [
                "dom",
                "dom.iterable",
                "esnext"
            ],
            "allowJs": true,
            "allowImportingTsExtensions": true,
            "skipLibCheck": true,
            "strict": true,
            "forceConsistentCasingInFileNames": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "react-jsx",
            "baseUrl": ".",
            "paths": {
                "@/*": ["src/*"]
            }
        },
        "include": [
            "src/**/*.ts", 
            "src/**/*.tsx"
        ]
    }`,

    "config-overrides.js": `const path = require('path');

    module.exports = function override(config) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };
    
      return config;
    };`,

    "tailwind.config.js": (usingTS) => `/** @type {import('tailwindcss').Config} */
    const defaultTheme = require("tailwindcss/defaultTheme");
    module.exports = {
        darkMode: ["class"],
        content: ["src/**/*.{${usingTS ? "ts,tsx" : "js,jsx"}}"],
        theme: {
            extend: {
                fontFamily: {
                    "consolas": ["Consolas", "Courier New", 'Courier', 'monospace'],
                    "uniSansCAPS": ["Uni Sans CAPS", ...defaultTheme.fontFamily.sans],
                    "montserrat": ["Montserrat", "Noto Sans JP", ...defaultTheme.fontFamily.sans],
                },
                keyframes: {
                    "heartPulse": {
                        '0%, 25%, 60%': { transform: 'scale(1)' },
                        '5%, 35%': { transform: 'scale(1.25)' },
                    }
                },
                animation: {
                    'heart-pulse': 'heartPulse 0.9375s linear infinite',
                },
            },
        },
    }`,


}