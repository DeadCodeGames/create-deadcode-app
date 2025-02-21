export default {
    "electron.main.js": `/**
    * This is your main process file :3
    * Here you can use node.js to control your application
    * You can use ipcMain to listen to messages from the renderer process, and ipcRenderer to send messages to the renderer process
    * For more info: https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process
    */
   
   const fs = require("fs")
   const { app, BrowserWindow, ipcMain } = require('electron');
   const path = require("path")
   let installExtension, REACT_DEVELOPER_TOOLS;
   if (!app.isPackaged) {
       ({ default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer'));
   }
   
   let win;
   
   function createWindow() {
     win = new BrowserWindow({
       minWidth: 450,
       minHeight: 430,
       width: 800,
       height: 600,
       frame: false,
       webPreferences: {
         devTools: !app.isPackaged,
         preload: path.join(__dirname, "preload.js"),
         contextIsolation: true,
         nodeIntegration: true
       }
     });
   
     win.loadURL(app.isPackaged ? \`file://\${path.join(__dirname, "../build/index.html")}\` : "http://localhost:3000");
     if (!app.isPackaged) installExtension(REACT_DEVELOPER_TOOLS).then((name) => console.log(\`Added Extension: \${name}\`)).catch((err) => console.log('An error occurred: ', err));
   
     win.on('maximize', () => {
       win.webContents.send('window-maximized');
     });
   
     win.on('unmaximize', () => {
       win.webContents.send('window-unmaximized');
     });
   }
   
   app.on('ready', createWindow);
   
   ipcMain.on('window-control', (event, action) => {
     // eslint-disable-next-line default-case
     switch (action) {
       case 'minimize':
         win.minimize();
         break;
       case 'maximize':
         if (win.isMaximized()) {
           win.unmaximize();
         } else {
           win.maximize();
         }
         break;
       case 'close':
         win.close();
         break;
     }
   });
   
   ipcMain.handle('is-window-maximized', () => {
     return win.isMaximized();
   });
   
   ipcMain.handle('get-process-platform', () => {
     switch (process.platform) {
       case 'win32':
         return 'Windows';
       case 'linux':
         return 'Linux';
       case 'darwin':
         return 'Mac';
       default:
         return 'Linux';
     }
   })
     
   ipcMain.on('update-preferences', (event, preferences) => {
     fs.writeFileSync(path.join(app.getPath("userData"), "./preferences.json"), JSON.stringify(preferences));
   })
   
   ipcMain.handle('get-preferences', async () => {
     let prefs;
       try {
         prefs = fs.readFileSync(path.join(app.getPath("userData"), "./preferences.json"), "utf-8");
       } catch (err) {
         if (err.code === 'ENOENT') {
           console.log('preferences.json not found - creating new one with default values');
           fs.writeFileSync(path.join(app.getPath("userData"), "./preferences.json"), JSON.stringify({ theme: 'dark' }));
           return { theme: 'dark' };
         } else {
           console.error(err);
         }
       }
     return JSON.parse(prefs);
   })`,
       
       "electron.preload.js": `/* this is your preload environment file :3
    * you can use this to expose node APIs to renderer
    * please, use this CAREFULLY! Only and ONLY expose what you need, and NOTHING MORE!
    * for more info: https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
    */
   
   const { contextBridge, ipcRenderer } = require("electron")
   
   contextBridge.exposeInMainWorld('Electron', {
       minimize: () => ipcRenderer.send('window-control', 'minimize'),
       maximize: () => ipcRenderer.send('window-control', 'maximize'),
       close: () => ipcRenderer.send('window-control', 'close'),
       isMaximized: () => ipcRenderer.invoke('is-window-maximized'),
       getPlatform: () => ipcRenderer.invoke('get-process-platform'),
       onMaximize: (callback) => ipcRenderer.on('window-maximized', callback),
       onUnmaximize: (callback) => ipcRenderer.on('window-unmaximized', callback),
       getPreferences: () => ipcRenderer.invoke('get-preferences'),
       updatePreferences: (preferences) => ipcRenderer.send('update-preferences', preferences)
   });`,
       
       "electron.WinControls.css": `div#window {
       top: 0;
       left: 0;
       position: absolute;
       height: 40px;
       width: -webkit-fill-available;
       display: flex;
       justify-content: space-between;
       align-items: center;
       -webkit-app-region: drag;
       flex-direction: row;
       flex-wrap: nowrap;
   }
   @import url(./windows.WinControls.css);
   @import url(./mac.WinControls.css);
   @import url(./linux.WinControls.css)`,
       
       "electron.windows.WinControls.css": `div#window[data-type="windows"] {
       padding: 0 0 0 10px;
   }
   
   div#window[data-type="windows"]>div#titleright>div#controls, div#window[data-type="windows"]>div#titleright>div#controls>* {
       -webkit-app-region: no-drag;
       font-size: 16px;
       display: flex;
       flex-direction: row;
       align-items: center;
       cursor: pointer;
       height: 100%;
       text-align: center;
       justify-content: center;
   }
   
   div#window[data-type="windows"]>div#titleleft, div#window[data-type="windows"]>div#titleright {
       display: flex;
       flex-direction: row;
       align-items: center;
       height: 100%;
   }
   
   div#window[data-type="windows"]>div#titleleft>div#windowtitle {
       font-family: 'Cascadia Mono', 'Consolas', monospace, 'Uni Sans CAPS', 'Montserrat', sans-serif;
       font-size: 14px;
       font-weight: 700;
       user-select: none;
       -webkit-user-select: none;
       padding-left: 4px;
       font-style: italic;
   }
   
   div#window[data-type="windows"]>div#titleright>div#controls>* {
       height: 100%;
       aspect-ratio: 1;
   }
   
   div#window[data-type="windows"]>div#titleright>div#controls>div#close, div#window[data-type="windows"]>div#titleright>div#controls>div#themechange {
       font-size: 20px !important;
   }
   
   div#window[data-type="windows"]>div#titleright>div#controls>div#close:hover {
       background-color: red
   }
   
   div#window[data-type="windows"]>div#titleright>div#controls>* {
       transition: background 0.125s ease-in-out
   }
   
   html.light {
       div#window[data-type="windows"] {
           background: #E9E9E9;
       }
   
       div#window[data-type="windows"]>div#titleright>div#controls, div#window[data-type="windows"]>div#titleright>div#controls>* {
           color: black;
       }
   
       div#window[data-type="windows"]>div#titleright>div#controls>div#minimize:hover, div#window[data-type="windows"]>div#titleright>div#controls>div#maximize:hover, div#window[data-type="windows"]>div#titleright>div#controls>div#themechange:hover {
           background-color: rgba(0, 0, 0, 0.25)
       }
   
       div#window[data-type="windows"]>div#titleleft>* {
           color: #0F0F0F;
       }
   }
   
   html.dark {
       div#window[data-type="windows"] {
           background: #161616;
       }
   
       div#window[data-type="windows"]>div#titleright>div#controls, div#window[data-type="windows"]>div#titleright>div#controls>* {
           color: white;
       }
   
       div#window[data-type="windows"]>div#titleright>div#controls>div#minimize:hover, div#window[data-type="windows"]>div#titleright>div#controls>div#maximize:hover, div#window[data-type="windows"]>div#titleright>div#controls>div#themechange:hover {
           background-color: rgba(255, 255, 255, 0.25)
       }
   
       div#window[data-type="windows"]>div#titleleft>* {
           color: #F0F0F0;
       }
   }`,
       
       "electron.linux.WinControls.css": `div#window[data-type="linux"] {
       padding-left: 0;
   }
   
   div#window[data-type="linux"]::before {
       content: "";
       width: 135px;
   }
   
   div#window[data-type="linux"]>div#titlemiddle>div#windowtitle {
       font-family: 'Cascadia Mono', 'Consolas', monospace, 'Uni Sans CAPS', 'Montserrat', sans-serif;
       font-size: 14px;
       font-weight: 700;
       user-select: none;
       -webkit-user-select: none;
       padding-left: 4px;
       font-style: italic;
   }
   
   div#window[data-type="linux"]>div#titleright>div#controls, div#window[data-type="linux"]>div#titleright>div#controls>* {
       -webkit-app-region: no-drag;
       font-size: 14px;
       display: flex;
       flex-direction: row;
       align-items: center;
       height: 100%;
       text-align: center;
       justify-content: center;
   }
   
   div#window[data-type="linux"]>div#titleright>div#controls>* {
       cursor: pointer;
   }
   
   div#window[data-type="linux"]>div#titleright>div#controls {
       padding: 11px 12px;
       column-gap: 13px;
   }
   
   div#window[data-type="linux"]>div#titleright>div#controls>* {
       padding: 2px;
       border-radius: 100%;
   }
   
   html.dark {
       div#window[data-type="linux"] {
           background: #161616;
           color: #F0F0F0;
       }
   
       div#window[data-type="linux"]>div#titleright>div#controls>* {
           background: #2C2C2C;
       }
   
       div#window[data-type="linux"]>div#titleright>div#controls>*:hover {
           background: #3E3E3E;
       }
   }
   
   html.light {
       div#window[data-type="linux"] {
           background: #E9E9E9;
           color: #0F0F0F;
       }
   
       div#window[data-type="linux"]>div#titleright>div#controls>* {
           background: #D3D3D3;
       }
   
       div#window[data-type="linux"]>div#titleright>div#controls>* {
           background: #C1C1C1;
       }
   }`,
       
       "electron.mac.WinControls.css": `div#window[data-type="mac"]::after {
       content: "";
       width: 118px;
   }
   
   div#window[data-type="mac"]>div#titlemiddle>div#windowtitle {
       font-family: 'Cascadia Mono', 'Consolas', monospace, 'Uni Sans CAPS', 'Montserrat', sans-serif;
       font-size: 14px;
       font-weight: 700;
       user-select: none;
       -webkit-user-select: none;
       padding-left: 4px;
       font-style: italic;
   }
   
   div#window[data-type="mac"]>div#titleleft>div#controls, div#window[data-type="mac"]>div#titleleft>div#controls>* {
       -webkit-app-region: no-drag;
       font-size: 14px;
       display: flex;
       flex-direction: row;
       align-items: center;
       height: 100%;
       text-align: center;
       justify-content: center;
   }
   
   div#window[data-type="mac"]>div#titleleft>div#controls>* {
       cursor: pointer;
       color: transparent;
       transition: color 0.25s ease;
   }
   
   div#window[data-type="mac"]>div#titleleft>div#controls {
       padding: 11px 12px;
       column-gap: 10px;
       & div#close {
           background: red !important;
       }
       & div#minimize {
           background: #FFD200 !important
       }
       & div#maximize {
           background: limegreen !important
       }
   }
   
   div#window[data-type="mac"]>div#titleleft>div#controls>*:hover {
       color: rgba(0, 0, 0, 0.75);
   }
   
   div#window[data-type="mac"]>div#titleleft>div#controls>* {
       padding: 0px;
       border-radius: 100%;
   }
   
   html.dark {
       div#window[data-type="mac"] {
           background: #161616;
           color: #F0F0F0;
       }
       div#window[data-type="mac"]>div#titleleft>div#controls>div#themechange {
           background: #F0F0F0;
       }
       div#window[data-type="mac"]>div#titleleft>div#controls>div#themechange:hover {
           color: black !important;
       }
   }
   
   html.light {
       div#window[data-type="mac"] {
           background: #E9E9E9;
           color: #0F0F0F;
       }
       div#window[data-type="mac"]>div#titleleft>div#controls>div#themechange {
           background: #0F0F0F;
       }
       div#window[data-type="mac"]>div#titleleft>div#controls>div#themechange:hover {
           color: white !important;
       }
   }`,
       
       "electron.WinControls": (projectName, useTypeScript, useTailwind) => {
           const tailwindStyles = {
               "#window": "absolute h-10 w-[-webkit-fill-available] flex justify-between items-center flex-row flex-nowrap left-0 top-0 app-region-drag bg-[#e9e9e9] dark:bg-[#161616]",
   
               "#window[data-type='windows']": "pl-2.5 pr-0 py-0",
               "#window[data-type='windows']>div#titleright>div#controls": "flex flex-row items-center cursor-pointer h-full text-center justify-center app-region-no-drag",
               "#window[data-type='windows']>div#titleleftandright": "flex flex-row items-center h-full",
               "#window[data-type='windows'] div#windowtitle": "text-sm font-bold select-none italic pl-1 font-consolas text-[#0F0F0F] dark:text-[#F0F0F0]",
               "#window[data-type='windows'] div#controls": "*:h-full *:aspect-[1] *:transition-[background] *:duration-[0.125s] *:ease-[ease-in-out] *:flex *:items-center *:justify-center text-black dark:text-white",
               "#window[data-type='windows'] div#themechangeandclose": "text-xl",
               "#window[data-type='windows'] div#notthemechangeorclose": "text-base",
               "#window[data-type='windows'] div#closehover": "hover:bg-[red]",
               "#window[data-type='windows'] div#notclosehover": "hover:bg-[rgba(0,0,0,0.25)] dark:hover:bg-[rgba(255,255,255,0.25)]",
   
               "#window[data-type='mac']": "bg-[#E9E9E9] text-[#0F0F0F] dark:bg-[#161616] dark:text-[#F0F0F0] after:content-[''] after:w-[118px]",
               "#window[data-type='mac'] div#windowtitle": "text-sm font-bold select-none italic pl-1 font-consolas",
               "#window[data-type='mac'] div#controls": "text-sm flex flex-row items-center h-full text-center justify-center app-region-no-drag gap-x-2.5 px-3 py-[11px]",
               "#window[data-type='mac'] div#controls>*": "*:text-sm *:flex *:flex-row *:items-center *:h-full *:text-center *:justify-center *:app-region-no-drag *:cursor-pointer *:text-transparent *:transition-[color] *:duration-[0.25s] *:ease-[ease] *:p-0 *:rounded-[100%] hover:text-[rgba(0,0,0,0.75)]",
               "#window[data-type='mac'] div#close": "bg-[red]",
               "#window[data-type='mac'] div#minimize": "bg-[#FFD200]",
               "#window[data-type='mac'] div#maximize": "bg-[limegreen]",
               "#window[data-type='mac'] div#themechange": "bg-[#0F0F0F] hover:text-[white] dark:bg-[#F0F0F0] dark:hover:text-[black]",
           }
           return `import { useEffect, useState, useContext } from 'react';${!useTailwind ? '\nimport "./WinControls.css";' : ''}
   import { AppContext } from '${"../.."}/App.${useTypeScript ? "tsx" : "jsx"}';
   
   export default function WinControls({type}${useTypeScript ? ': {type: null | "Linux" | "Windows" | "Mac"}' : ''}) {
       const {context, setContext} = useContext(AppContext);
       const [isMaximized, setIsMaximized] = useState${useTypeScript ? "<Boolean>" : ""}(false);
   
       useEffect(() => {
           const checkIfMaximized = async () => {
             const result${useTypeScript ? " : Boolean" : ""} = await window.Electron.isMaximized();
             setIsMaximized(result);
           };
       
           checkIfMaximized();
       
           window.Electron.onMaximize(() => {
             setIsMaximized(true);
           });
       
           window.Electron.onUnmaximize(() => {
             setIsMaximized(false);
           });
       
           return () => {
             window.Electron.onMaximize(() => {});
             window.Electron.onUnmaximize(() => {});
           };
         }, []);
   
       const handleMinimize = () => {
           window.Electron.minimize();
       };
   
       const handleMaximize = () => {
           window.Electron.maximize();
           setIsMaximized(!isMaximized);
       };
   
       const handleClose = () => {
           window.Electron.close();
       };
   
       const handleThemeChange = () => {
           if (document.documentElement.classList.contains("dark")) {
               document.documentElement.classList.remove("dark"); document.documentElement.classList.add("light");
               setContext({ ...context, preferences: { ...context.preferences, theme: "light" } })
           } else {
               document.documentElement.classList.remove("light"); document.documentElement.classList.add("dark")
               setContext({ ...context, preferences: { ...context.preferences, theme: "dark" } })
           }
       }
   
       const [htmlClass, setHtmlClass] = useState${useTypeScript ? "<string>" : ""}(document.documentElement.className);
   
       document.documentElement.classList.add(context.preferences.theme === "dark" ? "dark" : "light");
       document.documentElement.classList.remove(context.preferences.theme === "dark" ? "light" : "dark");
   
       useEffect(() => {
           const observer = new MutationObserver(() => {
               setHtmlClass(document.documentElement.className);
           });
   
           observer.observe(document.documentElement, {
               attributes: true,
               attributeFilter: ['class']
           });
   
           return () => {
               observer.disconnect();
           };
       }, []);
   
       switch (type) {
           default:
               return (
                   <div id="window" data-type="windows"${useTailwind ? ` className="${tailwindStyles["#window"]} ${tailwindStyles["#window[data-type='windows']"]}"` : ""}>
                       <div id="titleleft"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleleftandright"]}"` : ""}>
                           <div id="windowtitle"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows'] div#windowtitle"]}"` : ""}>${projectName}</div>
                       </div>
                       <div id="titleright"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleleftandright"]}"` : ""}>
                           <div id="controls"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleright>div#controls"]} ${tailwindStyles["#window[data-type='windows'] div#controls"]}"` : ""}>
                               <div id="themechange" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#themechangeandclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleThemeChange}>{ htmlClass.includes("dark") ? ("light_mode") : ("dark_mode")}</div>
                               <div id="minimize" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#notthemechangeorclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleMinimize}>horizontal_rule</div>
                               <div id="maximize" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#notthemechangeorclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleMaximize} style={{rotate: isMaximized ? "90deg" : ""}}>{ isMaximized ? ("stack") : ("square")}</div>
                               <div id="close" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#themechangeandclose"]} ${tailwindStyles["#window[data-type='windows'] div#closehover"]}` : ""}" onClick={handleClose}>close</div>
                           </div>
                       </div>
                   </div>
               )${useTypeScript ? " as React.JSX.Element" : ""};
           case "Windows":
               return (
                   <div id="window" data-type="windows"${useTailwind ? ` className="${tailwindStyles["#window"]} ${tailwindStyles["#window[data-type='windows']"]}"` : ""}>
                       <div id="titleleft"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleleftandright"]}"` : ""}>
                           <div id="windowtitle"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows'] div#windowtitle"]}"` : ""}>${projectName}</div>
                       </div>
                       <div id="titleright"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleleftandright"]}"` : ""}>
                           <div id="controls"${useTailwind ? ` className="${tailwindStyles["#window[data-type='windows']>div#titleright>div#controls"]} ${tailwindStyles["#window[data-type='windows'] div#controls"]}"` : ""}>
                               <div id="themechange" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#themechangeandclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleThemeChange}>{ htmlClass.includes("dark") ? ("light_mode") : ("dark_mode")}</div>
                               <div id="minimize" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#notthemechangeorclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleMinimize}>horizontal_rule</div>
                               <div id="maximize" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#notthemechangeorclose"]} ${tailwindStyles["#window[data-type='windows'] div#notclosehover"]}` : ""}" onClick={handleMaximize} style={{rotate: isMaximized ? "90deg" : ""}}>{ isMaximized ? ("stack") : ("square")}</div>
                               <div id="close" className="material-symbols${useTailwind ? ` ${tailwindStyles["#window[data-type='windows'] div#themechangeandclose"]} ${tailwindStyles["#window[data-type='windows'] div#closehover"]}` : ""}" onClick={handleClose}>close</div>
                           </div>
                       </div>
                   </div>
               )${useTypeScript ? " as React.JSX.Element" : ""};
           case "Mac":
               return (
                   <div id="window" data-type="mac"${useTailwind ? ` className="${tailwindStyles["#window"]} ${tailwindStyles["#window[data-type='mac']"]}"` : ""}>
                       <div id="titleleft">
                           <div id="controls">
                               <div id="close" className="material-symbols" onClick={handleClose}>close</div>
                               <div id="minimize" className="material-symbols" onClick={handleMinimize}>horizontal_rule</div>
                               <div id="maximize" className="material-symbols" onClick={handleMaximize}>{ isMaximized ? ("collapse_content") : ("expand_content")}</div>
                               <div id="themechange" className="material-symbols" onClick={handleThemeChange}>{ htmlClass.includes("dark") ? ("light_mode") : ("dark_mode")}</div>
                           </div>
                       </div>
                       <div id="titlemiddle">
                           <div id="windowtitle"${useTailwind ? ` className="${tailwindStyles["#window[data-type='mac'] div#windowtitle"]}"` : ""}>${projectName}</div>
                       </div>
                   </div>
               )${useTypeScript ? " as React.JSX.Element" : ""};
           case "Linux":
               return (
                   <div id="window" data-type="linux"${useTailwind ? `className="${tailwindStyles["#window"]}"` : ""}>
                       <div id="titlemiddle">
                           <div id="windowtitle">${projectName}</div>
                       </div>
                       <div id="titleright">
                           <div id="controls"${useTailwind ? `className="${tailwindStyles["#window[data-type='mac'] div#controls"]} ${tailwindStyles["#window[data-type='mac'] div#controls>*"]}"` : ""}>
                               <div id="themechange" className="material-symbols${useTailwind ? `${tailwindStyles["#window[data-type='mac'] div#themechange"]}` : ""}" onClick={handleThemeChange}>{ htmlClass.includes("dark") ? ("light_mode") : ("dark_mode")}</div>
                               <div id="minimize" className="material-symbols${useTailwind ? `${tailwindStyles["#window[data-type='mac'] div#minimize"]}` : ""}" onClick={handleMinimize}>horizontal_rule</div>
                               <div id="maximize" className="material-symbols${useTailwind ? `${tailwindStyles["#window[data-type='mac'] div#maximize"]}` : ""}" onClick={handleMaximize}>{ isMaximized ? ("collapse_content") : ("expand_content")}</div>
                               <div id="close" className="material-symbols${useTailwind ? `${tailwindStyles["#window[data-type='mac'] div#close"]}` : ""}" onClick={handleClose}>close</div>
                           </div>
                       </div>
                   </div>
               )${useTypeScript ? " as React.JSX.Element" : ""};
       }
   }`      
       },
   
       "electron.extraTypes": `import {IpcRendererEvent} from 'electron'
   declare global {
       interface Window {
           Electron: {
               minimize: () => void;
               maximize: () => void;
               close: () => void;
               isMaximized: () => Promise<boolean>;
               getPlatform: () => Promise<"Linux" | "Windows" | "Mac">;
               onMaximize: (callback: (event: IpcRendererEvent) => void) => void;
               onUnmaximize: (callback: (event: IpcRendererEvent) => void) => void;
               getPreferences: () => object;
               updatePreferences: (preferences: object) => void
           };
       }
   }`,
       
       "electron.preloadTypes": `declare namespace Electron {
       interface MainWorld {
           Electron: {
               minimize: () => void;
               maximize: () => void;
               close: () => void;
               isMaximized: () => boolean;
               getPlatform: () => string;
               onMaximize: (callback: (event: Electron.IpcRendererEvent) => void) => void;
               onUnmaximize: (callback: (event: Electron.IpcRendererEvent) => void) => void;
               getPreferences: () => object;
               updatePreferences: (preferences: object) => void;
           };
       }
   }`,
}