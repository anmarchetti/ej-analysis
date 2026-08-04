## Imports

The `ShowMoreLink` component relies on several imports:

- React's `FC` (Functional Component) and `useMemo` from the `react` package.
- `Tokens` from a local module `code/tokens`, which likely contains constants used for token replacement.
- `useStore` custom hook from `frontend/hooks/useStore` for accessing the application's state management.
- `Tokenizer` utility from `frontend/utils/tokenizer` for replacing tokens in strings.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`, an enumeration that provides keys for phrase lookups.
- `IconChevronRight` from `frontend/components/icons/ChevronRight`, a React component that renders a right chevron icon.

## Structure

The `ShowMoreLink` component is defined as a functional component using TypeScript. It accepts props defined by the `IShowMoreLinkProps` interface:

- `href`: A string that defines the URL the link will direct to.
- `shouldShowPrice`: A boolean to determine if the price should be displayed.
- `className`: An optional string for CSS class names.

The component utilizes the `useStore` custom hook to extract necessary values from the store:

- `minPrice`: Minimum price from the hotels store.
- `minPricePP`: Minimum price per person from the hotels store.
- `currency`: Currency information from the hotels store.
- `getPhrase`: Function to retrieve phrases by keys from the layout store.
- `formatMoney`: Function to format money values from the market store.

## Logic

1. **Price Calculation:**
   - The `price` is computed using the `useMemo` hook to optimize performance. It recalculates only when `minPrice`, `minPricePP`, or `currency` changes.
   - `formatMoney` is used to format `minPricePP` with the currency and no decimal places.
   - If `minPricePP` differs from `minPrice`, a phrase is fetched using `getPhrase` with a key from `SitecoreDictionary` and the price is included via token replacement. If no phrase is found, the formatted price is used directly.

2. **Rendering:**
   - The component returns an anchor (`<a>`) element with attributes set for `href`, `target`, `className`, and `rel`.
   - The content of the link depends on `shouldShowPrice`. If `true`, it displays the phrase with the price included. If `false`, it displays a default phrase without the price.
   - An `IconChevronRight` component is included next to the text to indicate a link that leads to more details.

This component is designed to display a link that optionally includes pricing information, formatted and localized according to the application's current state and settings. It is also styled and made secure with appropriate attributes like `rel='noreferrer'` to prevent tab nabbing.