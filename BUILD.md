# Build Instructions

## Build Environment

### Required Tools and Versions
- Node.js (version 14.x or later)
- npm (version 6.x or later)
- Gradle (version 6.x or later)

### Installation Instructions
1. Install Node.js and npm from [Node.js official website](https://nodejs.org/).
2. Install Gradle from [Gradle official website](https://gradle.org/install/).

## Build Commands

### Available Commands
- `npm run build`: Builds the project.
- `npm run build:webview`: Builds the webview UI.
- `npm run compile`: Compiles the TypeScript files.
- `npm run lint`: Runs the linter.

## Build Process

### Step-by-Step Instructions
1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Build the VSIX file:
   ```bash
   npm run build
   ```
3. The new VSIX file will be created in the `bin/` directory.

## Troubleshooting Tips

### Common Build Issues
- **Issue**: Build fails due to missing dependencies.
  **Solution**: Ensure all dependencies are installed by running `npm install` in the root directory and `npm install` in the `webview-ui` directory.
- **Issue**: Linter errors.
  **Solution**: Run `npm run lint` to identify and fix linting errors.

## References

### Existing Documentation
- [README.md](README.md)
- [esbuild problem matchers extension](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers)
