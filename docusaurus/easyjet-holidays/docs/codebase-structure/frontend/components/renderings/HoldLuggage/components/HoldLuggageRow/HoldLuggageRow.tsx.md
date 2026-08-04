## Imports

The component `HoldLuggageRow` uses several imports to access various functionalities and resources:

- **React and React Components**:
  - `React, { FC }` from 'react': Standard import for using React and Functional Components (FC).
  - `{ Text }` from '@sitecore-jss/sitecore-jss-react': Used to render text fields managed by Sitecore JSS.

- **Utilities and Hooks**:
  - `classNames` from 'classnames': A utility function to conditionally join class names together.
  - `{ observer }` from 'mobx-react': Enhances the component to react to MobX state changes.
  - `useStore` from 'frontend/hooks/useStore': A custom hook for accessing MobX stores.

- **Data and Models**:
  - `cmsUrls` from 'code/endpoints': Contains URL configurations, possibly for media and API endpoints.
  - `{ TStores }` from 'frontend/store/IStores': Type definitions for the stores used in the application.
  - `isTradeStore` from 'frontend/store/tradePortal': A utility to determine if the current store context is a trade store.
  - `{ ISitecoreField }` from 'models/sitecore/generic/ISitecoreField': Interface for Sitecore fields.

- **Components**:
  - `Button` from 'frontend/components/common/Button': A reusable button component.
  - `EditFilled`, `SvgInfoFilled`, `SvgTick` from 'frontend/components/icons-new': Custom SVG icons for visual elements.

- **Styles**:
  - `styles` from './HoldLuggageRow.module.scss': Module CSS for styling the `HoldLuggageRow` component.

## Structure

The `HoldLuggageRow` is a functional component that accepts props defined in the `IHoldLuggageRowProps` interface. These props include:

- **Textual Content**: `title`, `subtitle`, `description`, `editLabel`, `feesWarning`.
- **Identification and Actions**: `uniqueId`, `onEditClick`.
- **Pricing and Availability**: `price`, `includedForFreeText`.
- **Visuals**: `icon`.

The component structure includes:
- An outer `div` with conditional classes for styling based on the availability of hold luggage and page context.
- An image wrapped in a `div` to display the luggage icon.
- A text block containing the title, subtitle, description, and optionally, a label for items included for free.
- A price block that shows the price, a warning for fees, and an edit button if applicable.

## Logic

The component leverages MobX for state management and conditionally renders parts of its UI based on the state:

- **Store Usage**:
  - `useStore` hook is used to extract values from MobX stores to determine:
    - If prices should be visible.
    - If hold luggage can be added.
    - If the current page is the extras or confirmation page.

- **Conditional Rendering**:
  - The luggage icon is always displayed but its source URL is dynamically constructed using `cmsUrls.media(icon)`.
  - The title and subtitle are displayed next to each other, with the subtitle being optional.
  - An included-for-free label is displayed if `includedForFreeText` is provided and it's not the confirmation page.
  - The price section is only shown on the extras page and includes:
    - The price text if `isPriceVisible` is true.
    - A fees warning if provided.
    - An edit button if `editLabel` and `onEditClick` are provided, allowing for modification actions.

The component is wrapped with `observer` from MobX, enabling it to react to changes in the MobX state tree that affect the computed values used within.