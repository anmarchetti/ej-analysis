## Imports
The `FreeNightsIncludedPill` component imports several dependencies:

- `React` from the `react` package to leverage React framework functionalities.
- `cmsUrls` from `code/endpoints` to access media URLs.
- `Tokens` from `code/tokens` for token replacement in text strings.
- `useStore` hook from `frontend/hooks/useStore` to access the Redux store's state.
- `Tokenizer` from `frontend/utils/tokenizer` for replacing tokens in strings.
- `SitecoreDictionary` and `SiteSettings` from `models/enum` to utilize enumeration values for settings and dictionary phrases.
- `PricePill` component from `frontend/components/common/Pills/PricePill/PricePill` for rendering a styled pill component.

## Structure
The `FreeNightsIncludedPill` is a functional component in React that takes a single prop:

- `nights`: An integer representing the number of free nights included.

The component uses a custom hook `useStore` to extract methods and values from the Redux store:

- `getPhrase`: Fetches text based on a dictionary key.
- `getSetting`: Retrieves settings from the layout store.
- `isFreeNightsEnabled`: A boolean indicating if the free nights feature is enabled.

## Logic
The component first checks if the free nights feature is enabled and if the number of nights is greater than zero. If either condition fails, the component returns `null`, rendering nothing.

If the conditions are met, it proceeds with the following logic:

1. **Icon Retrieval**: Uses `getSetting` to fetch the URL for the free nights icon based on the site setting `FreeNightsIcon` and constructs the image URL using `cmsUrls.media`.

2. **Label Construction**:
   - Determines the appropriate label key from `SitecoreDictionary` based on whether `nights` is plural.
   - Uses `Tokenizer.replaceToken` to replace a placeholder token (`Tokens.Number`) in the fetched phrase with the actual number of nights.

3. **Rendering**:
   - The component renders a `PricePill` with a class name of `'free-nights-pill'`.
   - If an icon URL is available, it includes an `<span>` element with a background image set to the icon URL.
   - Displays the constructed label next to the icon.
   - The tooltip, which provides additional information about the free nights, is fetched using `getPhrase` with the tooltip's dictionary key and is positioned to the right of the pill.

This component elegantly handles conditional rendering and dynamic content based on the application's state and settings, providing a clear and interactive UI element for displaying information about included free nights.