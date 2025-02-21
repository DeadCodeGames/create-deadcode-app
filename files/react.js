export default {
    "indexReact": (usingTS, usingTailwind) => `import React from 'react';
    import ReactDOM from 'react-dom/client';
    ${usingTailwind ? "import './input.css';" : "import './index.css';"}
    import App from './App';${!usingTailwind ? "\nimport './fonts/fonts.css'" : ""}
    
    const root${usingTS ? " : ReactDOM.Root" : ""} = ReactDOM.createRoot(document.getElementById('root')${usingTS ? " as HTMLElement" : ""});
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );`,

    "AppReact": (usingRouter, usingElectron, useTypeScript) => {
        return `import { useState, useEffect, createContext } from "react"${usingRouter ? `import { ${usingElectron ? "HashRouter" : "BrowserRouter"} as Router, Routes, Route } from 'react-router-dom'\n` : ""}${usingElectron ? `import WinControls from './components/WinControls/WinControls.${useTypeScript ? "tsx" : "jsx"}'\n` : ""}

export const AppContext = createContext${useTypeScript ? "<any>" : ""}({ preferences: { theme: 'dark' } });

function AppContextProvider({ children }${": { children: React.ReactNode }"}) {
  const [context, setContext] = useState${useTypeScript ? "<any>" : ""}({ preferences: { theme: 'dark' } });
  const [shouldSetContext, setShouldSetContext] = useState${useTypeScript ? "<boolean>" : ""}(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const prefs = await window.Electron.getPreferences();
        setContext({ preferences: prefs });
        console.log(prefs)
        setShouldSetContext(true);
      } catch (error) {
        console.error('Failed to fetch client preferences:', error);
      }
    };

    fetchPreferences();
  }, []);

  useEffect(() => {
    if (shouldSetContext) window.Electron.updatePreferences(context.preferences)
  }, [context, shouldSetContext]);

  return (
    <AppContext.Provider value={{ context, setContext }}>
      {children}
    </AppContext.Provider>
  )${useTypeScript ? " as React.JSX.Element" : ""};
}

export default function App() {${usingElectron ? `\n  const [platform, setPlatform] = useState${useTypeScript ? '<"Linux" | "Windows" | "Mac" | null>' : ""}(null);
  useEffect(() => {
    async function getPlatform() {
      const platform = await window.Electron.getPlatform();
      setPlatform(platform);
    }
    getPlatform();
  }, []);` : ""}

  return (
    <AppContextProvider>${usingRouter ? `\n      <Router>${usingElectron ? `
        <WinControls type={platform} />` : ""}
        <div id="app">
          <Routes>
            <Route path="/" />
          </Routes>
        </div>
      </Router>` : `${usingElectron ? `
    <WinControls type={platform} />` : ""}
    <div id="app">
        <div id="app" />`}
    </AppContextProvider>
  )${useTypeScript ? " as React.JSX.Element" : ""};
}`
    },

    "hewwo:3": (useTypeScript, useTailwind) => {
        return `${useTailwind ? "import './hewwo.css'\n\n":""}export default function Hewwo() {
    const words${useTypeScript ? " : String[]":""} = ["owo", "OwO", "oWo", "Ōwò", "uwu", "UwU", "uWu", "iwi", "qwq", "pwp", "qwp", "TwT", "тwт", "TmT", "тmт", "ôWô", "òwó", "ùwú", ">w<", ">W<", "-w-", "-W-", "~w~", "~W~", ">m<", "omo", "OmO", "umu", "UmU", "-m-", "-M-", "~m~", "~M~", "owø", "^w^", ":3", ";3", "x3", "X3", ">:3", ">;3", ":3c", ";3c", ">:3c", ">;3c"];
    return (
        <div id='hewwo'>hewwo warudo <div id='uwu'>{words[Math.round(Math.random() * words.length)]}</div></div>
    )${useTypeScript ? " as React.JSX.Element" : ""};
}`
    }
}