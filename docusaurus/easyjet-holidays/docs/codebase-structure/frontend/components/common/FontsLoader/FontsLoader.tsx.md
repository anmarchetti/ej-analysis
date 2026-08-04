## Imports

The `FontsLoader` component imports several modules and types to handle font loading efficiently:

- `React, { useEffect }`: Imports React library and the `useEffect` hook for managing side effects.
- `Head`: Imported from `next/head`, used to modify the document's head.
- `IFontTypeConfig`: A TypeScript interface imported from `code/fonts.config` that defines the structure for font configuration objects.
- `getFontFaceAtRule, loadFont`: Utility functions imported from `./fonts.utils` that help generate CSS rules and load fonts respectively.

## Structure

The component `FontsLoader` is defined as a functional component in React, utilizing TypeScript for type safety. It takes a single prop:

- `fontsConfig`: An array of objects conforming to `IFontTypeConfig`, which includes details about each font to be loaded.

The internal structure includes:

- **Critical Fonts Calculation**: Filters `fontsConfig` to get only those fonts that have a critical subset defined.
- **Critical Font-Face CSS Generation**: Maps over the filtered critical fonts to generate CSS @font-face rules.
- **Effect Hook**: Uses `useEffect` to load the full fonts asynchronously after the component mounts.

The JSX returned by the component is contained within a `<Head>` tag, which is part of Next.js's API for altering the head of the HTML document.

## Logic

The logic of the `FontsLoader` component can be divided into two main stages of font loading:

### Stage 1: Preloading Critical Subsets
- **Preload Links**: For each critical font, a `<link>` tag with `rel='preload'` is generated. This instructs the browser to load these font files early in the page load process. Attributes like `as='font'`, `type='font/woff2'`, and `crossOrigin='anonymous'` ensure proper fetching and CORS handling.
- **Inline CSS**: If there is any critical font-face CSS generated, it is injected into the document using a `<style>` tag with `dangerouslySetInnerHTML`. This CSS contains the @font-face rules which define how the browser should display the text before the full fonts are loaded.

### Stage 2: Loading Full Fonts
- **Font Loading API**: After the component mounts, the `useEffect` hook triggers the loading of the full font files using the `loadFont` utility function. This function likely utilizes the CSS Font Loading API, allowing for more control over font loading and reducing the risk of FOIT (Flash of Invisible Text).

This two-stage loading approach optimizes the perceived performance by ensuring that text is visible and styled with a subset of the font as early as possible, while the full font loads in the background to provide the complete typographic experience.