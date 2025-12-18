# Interactive Mermaid Graph Visualizer

This project is a static website that allows users to visualize and interact with Mermaid dependency graphs. Users can click on nodes to highlight their transitive dependencies (orange) and dependents (green).

## Features

- **Interactive Graph**: Click nodes to trace dependencies up and down the stream.
- **Live Editor**: Paste Mermaid code and see changes instantly.
- **Validation**: Basic syntax error detection.
- **Modern UI**: Built with React, Vite, and Tailwind CSS.

## Local Development

To run this project locally:

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

## Testing

The core logic for parsing the Mermaid graph and calculating dependencies is located in `src/utils/graphParser.ts`. You can run the unit tests for this parser using the following command:

```bash
npx tsx src/utils/testParser.ts
```

## Deployment on Render

This project is designed to be deployed as a **Static Site** on [Render](https://render.com/).

1.  **Create a New Static Site**
    - Go to your Render Dashboard.
    - Click **New +** -> **Static Site**.

2.  **Connect Repository**
    - Connect your GitHub/GitLab repository containing this code.

3.  **Configure Build Settings**
    - **Name**: (Your choice, e.g., `mermaid-interactive`)
    - **Branch**: `main` (or the branch you are working on)
    - **Root Directory**: (Leave blank / default)
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist`

4.  **Deploy**
    - Click **Create Static Site**.
    - Render will build the project and deploy it. Once complete, you will be given a URL (e.g., `https://mermaid-interactive.onrender.com`).
