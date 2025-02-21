export default {
    ".gitignore": `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

    # dependencies
    /node_modules
    /.pnp
    .pnp.js
    
    # testing
    /coverage
    
    # production
    /build
    
    # misc
    .DS_Store
    .env.local
    .env.development.local
    .env.test.local
    .env.production.local
    
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*`,

    "README.md": (projectName) => `# ${projectName}\n###### Boilerplate generated using [npx create-deadcode-app](https://github.com/DeadCodeGames/create-deadcode-app)`,

    "buildndeploy.yml": `name: Deploy to GitHub Pages
on:
  push:
    branches:
      - main
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:

  # Build job
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "14"
          
      - name: Install dependencies
        run: npm i
        
      - name: Build project
        run: CI=false && npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build
          
  # Deployment job
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`,

        "index.html": (projectName) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Web site created using create-deadcode-app" />
    <title>${projectName}</title>
  </head>
  <body>
    <noscript>This application requires javaScript to function.</noscript>
    <div id="root"></div>
  </body>
</html>`,
}