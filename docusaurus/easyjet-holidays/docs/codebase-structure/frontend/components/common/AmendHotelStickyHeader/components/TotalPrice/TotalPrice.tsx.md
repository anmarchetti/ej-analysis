## Imports

The `TotalPrice` component relies on several imports from various libraries and internal modules:

- `FunctionComponent` from `react` is used to type the component as a functional component.
- `RichText` from `@sitecore-jss/sitecore-jss-nextjs` is used for rendering rich text content managed in Sitecore.
- `classNames` from `classnames` allows the conditional joining of class names.
- `observer` from `mobx-react` is used to make the component reactive to MobX state changes.
- Internal imports include utility functions, components, models, hooks, and styles:
  - `TrailingZeroDisplay` and `Tokens` from `code/currency` and `code/tokens` respectively, are used for formatting and token replacement in strings.
  - `useStore` from `frontend/hooks/useStore` is a custom hook for accessing MobX stores.
  - `IHolidaysStores` from `frontend/store/holidays` provides TypeScript interfaces for the stores.
  - `Tokenizer` from `frontend/utils/tokenizer` is used for replacing tokens in strings.
  - `CalloutOrientation` and `CalloutPosition` from `models/enum/Callout` and `SitecoreDictionary` from `models/enum/SitecoreDictionary` are used for defining enums.
  - `Callout` and `SvgInfoFilled` from `frontend/components/common/Callout/Callout` and `frontend/components/icons-new/InfoFilled` respectively, are used for displaying UI elements.
  - `styles` from `./TotalPrice.module.scss` contains module-specific styles.

## Structure

The `TotalPrice` component is structured as follows:

- **Props**: `ITotalPriceProps` defines the structure for the component's props, which includes:
  - `dataTid`: a string for test ID.
  - `tooltipLabel`: an optional string for the tooltip content.
  
- **Component Definition**: `TotalPrice` is a function component that uses destructuring to extract `dataTid` and `tooltipLabel` from its props.

- **Store Usage**: The `useStore` hook is utilized to extract necessary data and functions from the MobX stores:
  - `getPhrase`, `formatMoney`, `totalPrice`, `currency`, and `amendHotelFeePP` are extracted and used within the component.

- **Price Formatting**: The component formats prices using `formatMoney` and replaces tokens in strings using `Tokenizer`.

- **Rendering**: The component returns a structured JSX block that includes:
  - Labels and values for prices.
  - Conditional rendering of a `Callout` component for tooltips if `amendHotelFeePP` is truthy.

## Logic

The component's logic primarily revolves around data handling and UI presentation:

- **Data Handling**:
  - It computes `pricePP` by formatting `amendHotelFeePP` using specific formatting rules.
  - It uses `Tokenizer` to dynamically replace tokens in the `tooltipLabel` and the price per person label.
  
- **Conditional Rendering**:
  - The `Callout` component is only rendered if there is an additional hotel fee per person (`amendHotelFeePP`).

- **UI Components**:
  - Uses `RichText` for rendering the tooltip content, ensuring that rich text from Sitecore is properly displayed.
  - Uses the `SvgInfoFilled` icon inside the `Callout` for visual enhancement.

- **Styling**:
  - The component uses CSS modules for styling, with class names managed by the `classNames` function to conditionally apply styles based on the component’s state or props.

This component effectively demonstrates the integration of data handling, UI component structure, and reactive state management within a Sitecore and MobX-powered React application.