export default {
    "input.css": `@tailwind base;
    @tailwind components;
    @tailwind utilities;
    @import url('./fonts/fonts.css');
    @import url("https://cdn.jsdelivr.net/gh/DeadCodeGames/DeadCodeGames.github.io@main/fonts/Uni%20Sans/stylesheet.css");
    
    html, body {@apply m-0 bg-black text-white;} a {all: unset;@apply cursor-pointer underline m-[2.5px];} div.checklist pre.code { @apply border w-fit p-2 rounded-lg border-solid border-[#1F1F1F] bg-[#0F0F0F] my-4; }`,
        
        "index.css": `html, body {
        margin: 0px;
        background: black;
        color: white;
    }
    
    div#root>div#content {
        display: grid;
        grid-template-columns: 400px 350px auto;
        grid-template-rows: 112.5px 440px auto;
        padding: 33.3px 50px;
        gap: 16.7px 25px;
    }
    
    div#content>div#title {
        font-family: 'Consolas', 'Courier New', Courier, monospace;
        font-size: 48px;
        grid-row: 1;
        grid-column: 1 / 3;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }`,
}