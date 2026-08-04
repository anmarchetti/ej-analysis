## Imports

The `LivePrice` component imports various modules and utilities necessary for its functioning:

- **React and Hooks**: Uses `React`, `FC` (Function Component type), `useEffect`, and `useState` for component and state management.
- **Classnames**: A utility function `classNames` for conditionally joining class names together.
- **MobX React**: `observer` from `mobx-react` for making the component reactive to MobX state changes.
- **Custom Hooks and Services**:
  - `useHolidaysDestinationPageTypeName` and `useStore` for accessing custom hooks that abstract the business logic related to the component's functionality.
  - `offersService` for fetching data related to available origins based on certain conditions.
- **Utilities**:
  - Date utilities (`formatDateToQuery`) and price utilities (`getSearchQueryParamsByPrice`, `formatMoneyWithTouristTax`) for formatting and calculations.
  - Tracking utilities (`generateGenericValues`) for handling analytics and event tracking.
- **Models and Enums**:
  - Data models (`ILivePrice`) and enums (`SitecoreDictionary`, `EventTypes`, `EventActions`, `EventCategories`) to define and use consistent data types and values.
- **Components**:
  - Common components like `Link`, `PriceLabel`, and `TouristTaxGenericTooltip` for rendering parts of the UI.
  - Icon component `SvgChevronRight` for visual elements.
- **Styles**:
  - SCSS module `styles` from `./LivePrice.module.scss` for scoped CSS styling of the component.

## Structure

The `LivePrice` component is structured as follows:

- **Interface Definition (`ILivePriceProps`)**: Defines the props that the component accepts, including optional flags and data structures related to the live price, search, and UI customization.
- **Functional Component Definition**: The component is defined as a functional component using React's FC type, utilizing destructured props for easier access.
- **State Management**:
  - Local state for managing available origins and their loading status using `useState`.
- **Effects**:
  - A `useEffect` hook to trigger fetching of available origins when certain conditions are met, such as when the component is enabled to search for available origins and either is a link or a button for holiday results.
- **Helper Functions**:
  - Functions like `renderLivePrice`, `renderLivePricePrefix`, `renderLivePriceSuffix`, `renderPriceLabel`, and `renderContent` for breaking down the rendering logic into manageable parts.
- **Event Handling**:
  - `onLinkClick` function to handle click events, perform tracking, and set search values.
- **Conditional Rendering**:
  - The component conditionally renders different parts of its UI based on the props and the state, including handling of links, buttons, and displaying price information.

## Logic

The component's logic revolves around the following key functionalities:

- **Fetching Available Origins**: When enabled, the component fetches available origins based on the live price data and other search parameters. This is handled asynchronously, and the state is updated based on the fetched data.
- **Price Formatting and Display**:
  - The price is formatted using utility functions that account for tourist taxes if applicable. This formatted price is then displayed using the `PriceLabel` component.
- **Conditional UI Elements**:
  - Various UI elements such as chevrons and tooltips are conditionally rendered based on the props.
- **Event Tracking**:
  - Events are tracked when certain actions occur, such as clicking the link/button to view holiday results. This is done using the tracking utilities which generate event parameters and custom values based on the component's state and props.
- **Link Handling**:
  - Constructs search query URLs and handles navigation and state updates when links are clicked.
- **MobX State Usage**:
  - Uses the `useStore` hook to interact with global state managed by MobX, allowing the component to react to changes in the global state and derive values for local use.

Overall, the `LivePrice` component is a complex, stateful component that interacts heavily with both local state and global state, handles asynchronous operations, and performs conditional rendering based on various criteria.