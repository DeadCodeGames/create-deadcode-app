#!/usr/bin/env node

import { input, confirm, select } from "@inquirer/prompts";
import chalk from "chalk";
import { execSync } from "child_process";
import { existsSync, fstat, mkdirSync, writeFileSync } from "fs";
import path from "path";
import fs from "fs/promises";
import { readdir } from "fs";
import { createReadStream, readFileSync, statSync } from "fs";
import files from "./files.js";
import { Extract } from "unzipper";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { validate, fixName } from "validate-npm-package-name";

function tryUnzip(zipPath, outPath) {
    try {
        createReadStream(zipPath).pipe(Extract({ path: outPath })).on("close", () => console.log(`${chalk.green("√")} Successfully unzipped file "${chalk.bold.italic(path.resolve(path.join(outPath, path.basename(zipPath, path.extname(zipPath)))))}".`));
    } catch (err) {
        console.error(`${chalk.red("X")} Error unzipping file ${chalk.bold.italic(zipPath)}:`, err);
        process.exit(1);
    }
}

function isDirectoryEmpty(dirPath) {
    return new Promise((resolve, reject) => {
        readdir(dirPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Directory doesn't exist, consider it empty
                    resolve(true);
                } else {
                    reject(err);
                }
            } else {
                if (files.length === 0) {
                    resolve(true);
                } else if (files.length === 1 && (files[0].isDirectory() && files[0].name === ".git")) {
                    resolve("isEmptyGitRepo");
                } else if (files.length > 0 && files.some(file => file.isDirectory() && file.name === ".git") && files.some(file => file.isFile() && (file.name.endsWith(".md") || file.name === ".gitignore"))) {
                    const gitignoreContent = files.find(file => file.name === ".gitignore") ? readFileSync(path.join(dirPath, ".gitignore"), "utf-8") : undefined;
                    resolve(["isPopulatedGitRepo", files.map(file => { return { ...file, type: file.isDirectory() ? "directory" : "file" } }), gitignoreContent]);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

function tryCreateFileWithData(filePath, data) {
    try {
        writeFileSync(filePath, data);
        console.log(`${chalk.green("√")} Successfully created file "${chalk.bold.italic(path.resolve(filePath))}".`);
    } catch (err) {
        console.error(`${chalk.red("X")} Error writing file ${chalk.bold.italic(path.resolve(filePath))}:`, err);
        process.exit(1);
    }
}

function tryCreateDirectory(...dirPaths) {
    dirPaths.forEach((dirPath) => {
        try {
            mkdirSync(dirPath, { recursive: true });
            console.log(`${chalk.green("√")} Successfully created directory "${chalk.bold.italic(dirPath)}".`);
        } catch (err) {
            console.error(`${chalk.red("X")} Error creating directory ${chalk.bold.italic(path.resolve(dirPath))}:`, err);
            process.exit(1);
        }
    })
}

function generatePackageJSON(
    projectName,
    language,
    appFramework,
    cssFramework,
    appType,
    useRouter,
    useReactAppRewired,
    useGHPages
) {
    const isTypeScript = String(language).includes("TypeScript");
    const isElectron = String(appType).includes("Electron");
    const isTailwind = String(cssFramework).includes("Tailwind");

    function generateDependencies(language, appType, useRouter, useReactAppRewired) {
        return {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            "react-scripts": "5.0.1",
            ...(useReactAppRewired && { "react-app-rewired": "^2.2.1" }),
            ...(useRouter && { "react-router-dom": "^7.0.2" }),
            ...(isElectron
                ? {
                    "@electron/remote": "^2.1.2",
                    "electron-window-state": "^5.0.3",
                    concurrently: "^9.0.0",
                    "cross-env": "^7.0.3",
                    "wait-on": "^8.0.0",
                }
                : {}),
            ...(isTypeScript && {
                typescript: "^5.2.0",
                "@types/react": "^19.0.1",
                "@types/react-dom": "^19.0.2",
                ...(useRouter && { "@types/react-router-dom": "^5.1.8" }),
            }),
        };
    }

    function generateDevDependencies(language, cssFramework, appType) {
        return {
            ajv: "^8.17.1",
            ...(isTypeScript && {
                "@typescript-eslint/eslint-plugin": "^8.16.0",
                "@typescript-eslint/parser": "^8.16.0",
            }),
            ...(isTailwind && { tailwindcss: "^3.4.15" }),
            ...((isTailwind && isElectron) && {
                "@dead404code/tailwind-utilities": "^1.0.0",
            }),
            ...(isElectron && {
                electron: "^33.0.0",
                "electron-builder": "^25.1.8",
                "electron-devtools-installer":
                    "github:RichardKanshen/electron-devtools-installer",
            }),
        };
    }

    function generateScripts(
        appFramework,
        useReactAppRewired,
        isTypeScript,
        isElectron
    ) {
        return {
            ...(appFramework === "nextjs" && { dev: "next dev" }),
            start:
                appFramework === "react"
                    ? useReactAppRewired
                        ? "react-app-rewired start"
                        : "react-scripts start"
                    : "next start",
            build:
                appFramework === "react"
                    ? useReactAppRewired
                        ? "react-app-rewired build"
                        : "react-scripts build"
                    : "next build",
            ...(appFramework === "react"
                ? {
                    eject: useReactAppRewired
                        ? "react-app-rewired eject"
                        : "react-scripts eject",
                    test: useReactAppRewired
                        ? "react-app-rewired test"
                        : "react-scripts test",
                }
                : { lint: "next lint" }),
            ...(isTypeScript && { "type-check": "tsc --noEmit" }),
            ...(isElectron && {
                "electron:serve": `concurrently -k "cross-env BROWSER=none npm ${appFramework === "react" ? "start" : "dev"
                    }" "npm run electron:start"`,
                "electron:start": "wait-on tcp:3000 && electron .",
                "electron:build":
                    "npm run build && electron-builder -c.extraMetadata.main=build/main.js",
            }),
        };
    }

    const dependencies = generateDependencies(
        language,
        appType,
        useRouter,
        useReactAppRewired
    );
    const devDependencies = generateDevDependencies(
        language,
        cssFramework,
        appType
    );
    const scripts = generateScripts(
        appFramework,
        useReactAppRewired,
        isTypeScript,
        isElectron
    );

    return {
        name: fixName(projectName),
        version: "1.0.0",
        author: "Your Name <your.email@example.com> (https://your.website)",
        license: "MIT",
        private: true,
        dependencies,
        devDependencies,
        scripts,
        ...(isElectron ? { main: "public/main.js" } : {}),
        homepage: isElectron ? "./" : ".",
        browserslist: {
            production: [">0.2%", "not dead", "not op_mini all"],
            development: [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version",
            ],
        },
        ...(useReactAppRewired && {
            eslintConfig: {
                extends: ["react-app", "react-app/jest"],
            },
        }),
        "created via": `npx @dead404games/create-deadcode-app --name ${projectName} --lang ${isTypeScript ? "ts" : "js"
            } --framework ${appFramework === "react" ? "react" : "nextjs"
            } --css ${isTailwind ? "tailwind" : "vanilla"
            } --type ${isElectron ? "electron" : "web"
            } ${useGHPages ? "--ghpages " : "--noghpages "
            }${useRouter ? "--router " : "--norouter "}${useReactAppRewired ? "--rewire" : "--norewire"
            }`,
    };
}



async function main({ name, lang, framework, css, type, router, norouter, ghpages, noghpages, rewire, norewire }) {
    let projectName, projectPath, isPathOkay = false, keepGitignore = false;
    while (!isPathOkay && !validate(projectName).validForNewPackages) {
        if (name) {
            console.log(`${chalk.green("√")} What is the name of your project? ${chalk.cyan(fixName(name))} (inherited from CLI argument)`);
            projectName = fixName(name);
        } else {
            projectName = fixName(await input({ message: "What is the name of your project?", required: true, transformer: ((val, { isFinal }) => isFinal ? chalk.cyan(fixName(val)) : val) }));
        }

        projectPath = path.join(process.cwd(), ...projectName.split("/"));

        let pathStatus = await isDirectoryEmpty(projectPath)
        if (existsSync(projectPath) && pathStatus === false) {
            console.log(chalk.bold.red(projectPath.toLowerCase() === process.cwd().toLowerCase() ? "The current directory is not empty." : "Directory already exists, and is not empty."))
            let cleanPath = await confirm({ message: "Do you want to clean the directory (y), or would you like to choose a different path (N)?", default: false });
            if (cleanPath) {
                isPathOkay = await confirm({ message: `Just to confirm, does the path "${path.join(projectPath)}" look okay?\n${chalk.bold.red("This is a destructive action and WILL delete all files in the directory permanently. No going back.")}`, default: false });
                if (isPathOkay) await fs.rm(projectPath, { recursive: true, force: true }).catch((err) => console.error(err)).then(() => console.log(`${chalk.green("√")} Successfully deleted the ${projectPath} directory.`));
            } else {
                projectName = null, name = null;
            }
        } else if (existsSync(projectPath) && pathStatus === "isEmptyGitRepo") {
            console.log(chalk.bold.red(projectPath.toLowerCase() === process.cwd().toLowerCase() ? "The current directory is an empty git repo." : "Directory is an empty git repo."));
            isPathOkay = await confirm({ message: `Do you want to use the empty repo at path "${path.join(projectPath)}"` });
        } else if (existsSync(projectPath) && pathStatus[0] === "isPopulatedGitRepo") {
            const [, pathFiles, gitignoreContent] = pathStatus;
            console.log(chalk.bold.red(projectPath.toLowerCase() === process.cwd().toLowerCase() ? "The current directory is a git repo with files in it." : "Directory is a git repo with files in it."));
            let filesKeep = pathFiles.filter(file => file.name.match(/(\.gitignore|\.git|^.*?\.md$)/gmi)), filesDelete = pathFiles.filter(file => !file.name.match(/(\.gitignore|\.git|^.*?\.md$)/gmi));
            console.log(`${filesDelete.length > 0 ? `${chalk.red("By proceeding, the following files will be deleted forever:\n\n") + chalk.red(filesDelete.sort((a, b) => a.type === "directory" && b.type !== "directory" ? -1 : 1).map(f => " - " + (f.type === "directory" ? "directory " : "") + f.name).join("\n"))}\n\n` : ""}${chalk.green("The following files will be kept:")}\n\n${chalk.green(filesKeep.map(f => " - " + (f.type === "directory" ? "directory " : "") + f.name + (f.name === ".gitignore" ? ` (you will have the choice to overwrite this file in the next step)` : "")).join("\n"))}\n`);
            isPathOkay = await confirm({ message: `Do you want to use the git repo at path "${path.join(projectPath)}"`, default: false });
            if (isPathOkay && pathFiles.find(f => f.name === ".gitignore")) {
                console.log(`${chalk.red(`\nThis is your current .gitignore:\n\n${gitignoreContent}\n\n`)}${chalk.green(`This is the .gitignore that we have made for you:\n\n${files[".gitignore"]}`)}\n`)
                keepGitignore = await confirm({ message: `Do you want to ${chalk.red("keep your .gitignore file (y)")}, or ${chalk.green("use our preset (N)")} ?`, default: false });
                filesDelete.forEach(async (f) => { await fs.rm(path.join(projectPath, f.name), { recursive: true, force: true }).catch((err) => console.error(err)).then(console.log(`${chalk.green("√")} Successfully deleted ${f.type === "directory" ? "directory" : "file"} ${f.name}${f.type === "directory" ? " and its contents" : ""}.`)) });
            };

        } else {
            isPathOkay = ((existsSync(projectPath) && pathStatus === true) || !existsSync(projectPath)) && await confirm({ message: `Does the path "${path.join(projectPath)}" look okay?` });
        }
    }

    let language;
    if (lang) {
        language = lang === "js" ? "JavaScript" : "TypeScript";
        console.log(`${chalk.green("√")} What language are you using? ${lang === "js" ? chalk.bgHex("#F0DB4E").hex("#323230")("JavaScript") : chalk.bgHex("#2D79C7").hex("#FFFFFF")("TypeScript")} (inherited from CLI argument)`);
    } else {
        language = await select({ message: "Which language are you using?", choices: [chalk.bgHex("#F0DB4E").hex("#323230")("JavaScript"), chalk.bgHex("#2D79C7").hex("#FFFFFF")("TypeScript")] });
    }

    let appFramework;
    if (framework) {
        appFramework = framework === "nextjs" ? "nextjs" : "react";
        console.log(`${chalk.green("√")} What framework are you using? ${framework === "nextjs" ? chalk.bgHex("#000").hex("#FFF")("Next.js") : chalk.bgHex("#58C4DC").hex("#FFF")("React")} (inherited from CLI argument)`);
    } else {
        appFramework = await select({ message: "What framework are you using?", choices: [chalk.bgHex("#000").hex("#FFF")("Next.js"), chalk.bgHex("#58C4DC").hex("#FFF")("React")] });
    }

    let cssFramework;
    if (css) {
        cssFramework = css === "tailwind" ? "Tailwind" : "Vanilla CSS";
        console.log(`${chalk.green("√")} What CSS framework are you using? ${css === "tailwind" ? chalk.bgHex("#38bdf8").hex("#FFFFFF")("Tailwind") : chalk.hex("#FFFFFF")("Vanilla CSS")} (inherited from CLI argument)`);
    } else {
        cssFramework = await select({ message: "Are you using a CSS framework?", choices: [chalk.bgHex("#38bdf8").hex("#FFFFFF")("Tailwind"), chalk.hex("#FFFFFF")("Vanilla CSS")] });
    }


    let appType;
    if (type) {
        appType = type === "electron" ? "Electron" : "Web";
        console.log(`${chalk.green("√")} Is this project going to be a web app, or an ${chalk.bgHex("#2B2E3A").hex("#9FEAF9")("Electron")} app? ${type === "electron" ? chalk.bgHex("#2B2E3A").hex("#9FEAF9")("Electron") : chalk.hex("#FFFFFF")("Web")} (inherited from CLI argument)`);
    } else {
        appType = await select({ message: `Is this project going to be a ${chalk.hex("#FFFFFF")("Web")} app, or an ${chalk.bgHex("#2B2E3A").hex("#9FEAF9")("Electron")} app?`, choices: [chalk.hex("#FFFFFF")("Web"), chalk.bgHex("#2B2E3A").hex("#9FEAF9")("Electron")] });
    }

    let useGitHubPages;
    if (appType.includes("Electron")) {
        useGitHubPages = false;
    } else if (ghpages !== undefined) {
        useGitHubPages = ghpages;
        console.log(`${chalk.green("√")} Are you going to be deploying via GitHub Pages? ${useGitHubPages ? chalk.cyan("Yes") : chalk.cyan("No")} (inherited from CLI argument)`);
    } else if (noghpages !== undefined) {
        useGitHubPages = !noghpages;
        console.log(`${chalk.green("√")} Are you going to be deploying via GitHub Pages? ${useGitHubPages ? chalk.cyan("Yes") : chalk.cyan("No")} (inherited from CLI argument)`);
    } else {
        useGitHubPages = await confirm({ message: "Are you going to be deploying via GitHub Pages?", default: false });
    }

    let useRouter;
    if (router !== undefined) {
        useRouter = router;
    } else if (norouter !== undefined) {
        useRouter = !norouter;
    } else {
        useRouter = await confirm({ message: `Would you like ${chalk.bgHex("#252525").white("React ") + chalk.bgHex("#252525").hex("#F94949")("Router")} with that?`, default: true });
    }

    let useReactAppRewired;
    if (rewire !== undefined) {
        useReactAppRewired = rewire;
    } else if (norewire !== undefined) {
        useReactAppRewired = !norewire;
    } else {
        useReactAppRewired = await confirm({ message: "Would you like to use React App Rewired instead of React Scripts? This will allow you to use path aliases in your project.", default: true });
    }

    console.log(projectName, language, cssFramework, appType, useRouter, useReactAppRewired)

    let packageJSON = generatePackageJSON(projectName, language, cssFramework, appType, useRouter, useReactAppRewired);

    console.log(`This is your current config:\n\n${chalk.bold.white(JSON.stringify(packageJSON, null, 2))}\n\n`)
    if (!await confirm({ message: "Would you like to proceed with the project creation?", default: true })) {
        console.log("User cancelled."); process.exit(0);
    }

    if (existsSync(projectPath) && await isDirectoryEmpty(projectPath)) {
        console.log(`${chalk.green("√")} Empty directory "${chalk.bold.italic(projectPath)}" already exists.`);
    } else {
        tryCreateDirectory(projectPath)
    }

    const packageJSONPath = path.join(projectPath, "package.json");

    tryCreateFileWithData(packageJSONPath, JSON.stringify(packageJSON, null, 2));
    tryCreateFileWithData(path.join(projectPath, "README.md"), files["README.md"](projectName));
    if (!keepGitignore) tryCreateFileWithData(path.join(projectPath, ".gitignore"), files[".gitignore"]);
    if (useGitHubPages) {
        tryCreateDirectory(path.join(projectPath, ".github", "workflows"));
        tryCreateFileWithData(path.join(projectPath, ".github", "workflows", "buildndeploy.yml"), files["buildndeploy.yml"]);
    }
    tryCreateDirectory(path.join(projectPath, "public"), path.join(projectPath, "src"));
    tryCreateFileWithData(path.join(projectPath, "public", "index.html"), files["index.html"](projectName));
    tryCreateFileWithData(path.join(projectPath, "src", language.includes("TypeScript") ? "index.tsx" : "index.js"), files["indexReact"](language.includes("TypeScript"), cssFramework.includes("Tailwind")));
    if (language.includes("TypeScript")) tryCreateFileWithData(path.join(projectPath, "tsconfig.json"), files["tsconfig.json"]);
    if (useReactAppRewired) tryCreateFileWithData(path.join(projectPath, "config-overrides.js"), files["config-overrides.js"]);
    if (cssFramework.includes("Tailwind")) {
        tryCreateFileWithData(path.join(projectPath, "tailwind.config.js"), files["tailwind.config.js"](language.includes("TypeScript")));
        tryCreateFileWithData(path.join(projectPath, "src", "input.css"), files["input.css"]);
    } else {
        tryCreateFileWithData(path.join(projectPath, "src", "index.css"), files["index.css"]);
    }
    if (appType.includes("Electron")) {
        tryCreateFileWithData(path.join(projectPath, "public", "main.js"), files["electron.main.js"]);
        tryCreateFileWithData(path.join(projectPath, "public", "preload.js"), files["electron.preload.js"]);
        tryCreateDirectory(path.join(projectPath, "src", "components", "WinControls"));
        if (cssFramework.includes("Vanilla CSS")) {
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", "WinControls.css"), files["electron.WinControls.css"]);
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", "windows.WinControls.css"), files["electron.windows.WinControls.css"]);
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", "mac.WinControls.css"), files["electron.mac.WinControls.css"]);
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", "linux.WinControls.css"), files["electron.linux.WinControls.css"]);
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", `WinControls.${language.includes("TypeScript") ? "tsx" : "jsx"}`), files["electron.WinControls"](projectName, language.includes("TypeScript"), false));
        } else {
            tryCreateFileWithData(path.join(projectPath, "src", "components", "WinControls", `WinControls.${language.includes("TypeScript") ? "tsx" : "jsx"}`), files["electron.WinControls"](projectName, language.includes("TypeScript"), true));
        }
        if (language.includes("TypeScript")) {
            tryCreateFileWithData(path.join(projectPath, "src", "electron.d.ts"), files["electron.extraTypes"])
        }
    }
    tryCreateFileWithData(path.join(projectPath, "src", `App.${language.includes("TypeScript") ? "tsx" : "jsx"}`), files["AppReact"](useRouter, appType.includes("Electron"), language.includes("TypeScript")));
    tryCreateDirectory(path.join(projectPath, "src", "components", "Hewwo"));
    tryCreateFileWithData(path.join(projectPath, "src", "components", "Hewwo", `Hewwo.${language.includes("TypeScript") ? "tsx" : "jsx"}`), files["hewwo:3"](language.includes("TypeScript"), cssFramework.includes("Tailwind")));
    console.log(process.argv[1], path.dirname(process.argv[1]));
    const runIsDir = await statSync(process.argv[1]);
    tryUnzip(path.join(runIsDir.isDirectory() ? process.argv[1] : path.dirname(process.argv[1]), "fonts.zip"), path.join(projectPath, "src"));
}

const argv = Object.fromEntries(
    Object.entries(

        yargs(hideBin(process.argv))
            .scriptName("create-deadcode-app")
            .help()

            .describe("name", "Project name")
            .string("name")

            .describe("lang", "Choose the language for your project")
            .choices("lang", ["js", "ts"])

            .describe("framework", "Choose the app framework")
            .choices("framework", ["react", "nextjs"])

            .describe("css", "Choose the CSS framework")
            .choices("css", ["tailwind", "vanilla"])

            .describe("type", "Choose your app type")
            .choices("type", ["web", "electron"])

            .describe("ghpages", "Include a workflow to deploy to GitHub Pages (--type=web)")
            .boolean("ghpages")

            .describe("noghpages", "Omit a workflow to deploy to GitHub Pages (--type=web)")
            .boolean("noghpages")

            .describe("router", "Use React Router")
            .boolean("router")

            .describe("norouter", "Omit React Router")
            .boolean("norouter")

            .describe("rewire", "Use React App Rewired")
            .boolean("rewire")

            .describe("noRewire", "Omit React App Rewired")
            .boolean("noRewire")

            .describe("help", "Show this help menu (hello :3)")
            .describe("version", "Show version info")

            .parse()

    ).filter(([key]) => ['name', 'lang', 'framework', 'css', 'type', 'router', 'norouter', 'ghpages', 'noghpages', 'rewire', 'norewire'].includes(key))
);

main(argv).catch((error) => {
    if (error.toString().startsWith("ExitPromptError")) { console.log("User exited."); process.exit(1); }
    console.error("Error:", error);
    process.exit(2);
});
