## Imports

The `HeadHrefLang` component uses several imports from various libraries and local files:

- **React**: Imports React base features and `isValidElement` utility to validate React elements.
- **mobx-react**: Imports `observer` to make the React component reactive to MobX state changes.
- **next/head**: Imports `Head` for managing the document head.
- **Local Utilities and Hooks**:
  - `getCMSLang` from `code/cmsLang` to retrieve language settings.
  - `useStore` from `frontend/hooks/useStore` for accessing MobX store state.
  - `isEmptyObject` from `frontend/utils/object.utils` to check if an object is empty.
  - `purifyUrl` from `frontend/utils/url.utils` to sanitize URLs.
- **Local Component Utils**:
  - `getHreflangTagByPageUrl` and `parseManualHreflangTag` from the same directory's `utils` to manage hreflang tags based on the page URL and manual configurations.

## Structure

The `HeadHrefLang` component is structured as follows:

- **Functional Component Definition**: Defined as a functional component using React hooks.
- **Store State Extraction**: Uses the `useStore` hook to extract necessary states from the MobX store, such as language, page fields, URLs, and utility functions.
- **Conditional Rendering**:
  - First, it checks if manual hreflang tags are provided and valid; if so, it renders these tags inside the `<Head>` component.
  - If no manual tags are provided and the page URLs object is empty, it returns `null`, indicating no hreflang tags are needed.
  - Otherwise, it proceeds to generate hreflang tags dynamically based on available page URLs.
- **Dynamic Hreflang Tag Generation**: If manual tags are not set and page URLs exist, it generates hreflang tags for each language version, including the current one.

## Logic

The component's logic can be summarized in the following steps:

1. **Extract State via MobX**: Using the `useStore` custom hook, the component accesses various pieces of state from the MobX store related to the current page and site configuration.
2. **Manual Hreflang Tags Handling**:
   - Parses any manually set hreflang tags using `parseManualHreflangTag`.
   - Checks if these tags are either a non-empty array or a valid React element.
   - If valid, these tags are directly used within the `<Head>` component.
3. **Auto-generation of Hreflang Tags**:
   - If no manual tags are provided and the `pageUrls` object isn't empty, it indicates that multiple language versions of the page are available.
   - Calls `getHreflangTagByPageUrl` to generate hreflang tags for each language version based on the URLs provided by the MobX store.
   - Each generated tag is mapped over to create `<link rel='alternate' ... />` elements, which are then rendered within the `<Head>` component.
4. **Current Page URL Tag**: Independently of the above, a hreflang tag for the current full URL of the page is always added using the `purifyUrl` utility to ensure the URL is clean and the `getCMSLang` function to set the correct language attribute.

This component effectively manages the SEO aspect of multi-language sites by ensuring that search engines are aware of the different language versions available for the current page, aiding in proper indexing and user redirection based on language preferences.