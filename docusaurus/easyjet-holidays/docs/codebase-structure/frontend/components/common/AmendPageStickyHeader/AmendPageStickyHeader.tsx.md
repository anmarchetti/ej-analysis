### Imports

The AmendPageStickyHeader component imports several modules and components to function properly:

- **React and MobX Libraries:**
  - `FunctionComponent` from `react` for typing the functional component.
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.

- **Utility and Hooks:**
  - `classnames` for dynamically combining class names based on conditions.
  - `useStore` custom hook for accessing MobX stores.

- **Custom Types and Enums:**
  - `IHolidaysStores` interface from `frontend/store/holidays` which likely contains the type definition for holiday-related stores.
  - `CalloutOrientation` and `CalloutPosition` enums from `models/enum/Callout` for configuring the position of callouts.
  - `SitecoreDictionary` enum for accessing string constants.
  - `ISitecoreField` interface from `models/sitecore/generic/ISitecoreField` for typed Sitecore fields.

- **Components:**
  - `Button`, `CalloutPrice`, and `StickyBox` from various frontend component directories, used to build parts of the UI.
  - `ComponentWrapper` for additional component styling or logic encapsulation.

- **Styles:**
  - `styles` from `./AmendPageStickyHeader.module.scss` for CSS module styling specific to this component.

### Structure

The `AmendPageStickyHeader` component is structured as follows:

- **Props:**
  - `IAmendPageStickyHeaderProps` defines the properties that the component accepts, including children nodes, button click handler, price information, and optional flags for UI control.

- **Component Function:**
  - Utilizes a functional component structure with destructured props for clarity and ease of use.
  - Uses the `useStore` hook to extract the `getPhrase` function from the `layoutStore`, which is part of `IHolidaysStores`.

- **JSX Structure:**
  - The main JSX returned by the component is wrapped in a `StickyBox`, which likely ensures that this header remains visible during page scrolling.
  - Inside the sticky box, a `ComponentWrapper` provides an additional layer for potential theming or logic encapsulation.
  - The component conditionally renders price information and a button, depending on the props like `isPriceHidden` and `isConfirmButtonDisabled`.
  - The `Button` component is used for the continue action, with its label fetched dynamically using `getPhrase` from the Sitecore dictionary.

### Logic

The component's logic primarily revolves around conditional rendering and data fetching:

- **Conditional Rendering:**
  - The price section is only rendered if `isPriceHidden` is false. Within this section, the price and its label are displayed, and a `CalloutPrice` component is used to show the price with a tooltip if `priceTooltipContent` is provided.
  - The continue button is always rendered but can be disabled via `isConfirmButtonDisabled`. The button's text is dynamically set using the `getPhrase` function, which fetches phrases based on keys from the `SitecoreDictionary`.

- **Data Handling:**
  - `getPhrase` from the `layoutStore` is used to handle dynamic text based on Sitecore's dictionary, ensuring that the UI text can be easily localized or changed.

- **Styling:**
  - Uses CSS modules for styling, with conditions applied using the `classnames` utility to manage dynamic classes based on component state or props.

Overall, `AmendPageStickyHeader` is a functional React component designed to provide a sticky header interface for amending pages, with support for dynamic localization and conditional UI rendering.