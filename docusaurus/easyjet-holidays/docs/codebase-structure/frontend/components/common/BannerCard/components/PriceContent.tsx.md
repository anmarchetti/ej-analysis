### Imports

The `PriceContent` component uses several imports from internal and external libraries:

- **React**: Base library for building the component.
- **classNames**: A utility function for conditionally joining class names together.
- **observer**: A function from `mobx-react` for making the component reactive to MobX state changes.
- **usePriceLabels**: A custom React hook for fetching price labels.
- **useStore**: A custom React hook for accessing MobX stores.
- **TStores**: A TypeScript type representing the structure of the stores.
- **ILivePrice**: An interface describing the live price object.
- **SitecoreDictionary**: An enumeration that provides keys for Sitecore dictionary items.
- **ISitecoreField**, **ISitecoreLink**: Interfaces for typing Sitecore related fields.
- **ConditionalWrapper**: A component that conditionally wraps its children with a given wrapper component.
- **RouterLink**: A component for handling internal routing.
- **styles**: The CSS module for styling the `PriceContent` component.

### Structure

The `PriceContent` component is structured as follows:

**Props Interface (`IPriceContentProps`)**:
- `link`: Object that may contain a link (URL).
- `livePrice`: An optional object containing details about a live price.
- `isExternalExtras`: A boolean flag indicating if external extras are applied.
- `price`: Optional price information.
- `pricePrefix`: Optional prefix for the price.

**Component Definition**:
- The component is a functional component utilizing React hooks.
- Conditional rendering is used based on the presence of `livePrice` or `price`.
- A nested function `renderLivePriceContent` is defined for rendering the live price details.

**Wrapper Usage**:
- `ConditionalWrapper` is used to optionally wrap the price content with a `RouterLink` if the `link` prop contains a valid URL.

### Logic

**Price Formatting**:
- The `formatMoney` function is extracted from the `marketStore` via the `useStore` hook. This function is used to format the price details.

**Label Retrieval**:
- Labels before and after the price are fetched using the `usePriceLabels` hook, which retrieves labels based on a key from `SitecoreDictionary`.

**Conditional Rendering**:
- The component returns `null` if neither `livePrice` nor `price` props are provided.
- If `livePrice` is available, it renders the live price using `renderLivePriceContent`.
- If only `price` is available, it renders the price along with an optional `pricePrefix`. The rendering of `price` uses `dangerouslySetInnerHTML` for HTML content.

**CSS Class Handling**:
- The `classNames` function is used to conditionally apply CSS classes based on the `isExternalExtras` flag.

**Link Handling**:
- If a `link` with a valid `href` is provided, the price content is wrapped in a `RouterLink`, making it clickable and directing to the specified URL.

This component effectively displays price information, optionally wrapped in a link, with support for live updates via MobX and custom styling based on the presence of external extras.