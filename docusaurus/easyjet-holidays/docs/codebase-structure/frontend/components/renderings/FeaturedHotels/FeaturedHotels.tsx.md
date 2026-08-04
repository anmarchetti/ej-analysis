### Imports

The `FeaturedHotels` component relies on a variety of imports from React libraries, Sitecore JSS, utility functions, models, hooks, and other components:

- **React and React Hooks**: Uses `React`, `useEffect`, `useMemo`, and `useState` for managing the component lifecycle and state.
- **React Intersection Observer**: Utilizes `InView` to handle visibility changes of the component for tracking purposes.
- **Sitecore JSS**: Imports `RichText` and `Text` for rendering Sitecore managed rich text and plain text fields.
- **Classnames**: A utility function `classNames` for conditionally joining class names together.
- **MobX**: Uses `observer` from `mobx-react` for making the component reactive to state changes in MobX stores.
- **Custom Hooks**: `useMobileViewport` for checking if the viewport is mobile-sized, and `useStore` for accessing MobX stores.
- **Utility Functions**: Functions like `getCustomisableTitleClassName`, `getPaddingSizeClassName`, `getTextPositionClassName`, and `getDestinationLivePriceByCode` for handling various styling and data manipulation tasks.
- **Models**: Various type and interface imports such as `ICustomisableTitleAndDescriptionParams`, `IFeaturedHotel`, `IFeaturedHotelsWithPrice`, `ILivePrice`, enums, and more to ensure type safety and structured data management.
- **Components**: Imports `FeaturedHotelCard` and `FeaturedHotelsRenderHelper` for rendering individual hotels or a collection of hotels, and `TouristTaxGenericTooltip` for displaying tax information.

### Structure

The `FeaturedHotels` component is structured as follows:

1. **Interface Definitions**: Defines TypeScript interfaces for the component props and Sitecore fields to ensure type safety.
2. **Functional Component Definition**: The main React functional component using destructuring for props.
3. **State and Store Hooks**: Uses custom hooks to access MobX stores and React state hooks to manage local state, specifically for live prices.
4. **Effects and Data Loading**: An `useEffect` hook to load live prices when the component or its relevant props change.
5. **Memoized Values**: Uses `useMemo` for calculating derived data like hotels with their live prices and whether tourist tax tooltip should be displayed.
6. **Conditional Rendering**: Checks and early returns `null` if there are no hotels to display.
7. **Dynamic Classes and Rendering Logic**: Computes CSS class names dynamically based on props and conditions. Decides on the layout (carousel or single view) based on the number of hotels and viewport size.
8. **Event Handlers**: Functions for tracking interactions like hotel impressions and clicks.
9. **JSX Structure**: The return statement contains the JSX structure, which conditionally renders different components and handles visibility tracking.

### Logic

The component's logic revolves around several key functionalities:

- **Live Price Fetching and Management**: Fetches live prices for featured hotels and updates the component state with these prices. This is dependent on whether live price feature is enabled in the store.
- **Tracking and Analytics**: Implements visibility tracking to fire analytics events when the hotels component comes into view. Also, handles click tracking for personalized interactions.
- **Responsive Behavior**: Adapts the display (carousel vs. single card) based on the viewport size.
- **Tourist Tax Information**: Decides whether to show tourist tax information based on several conditions like whether the tourist tax feature is enabled, if prices are available, and if the hotel prices are valid.
- **Dynamic Styling**: Computes dynamic class names for HTML elements based on the component's parameters and settings from the store, enhancing the flexibility in styling based on external configurations.
- **Conditional Text and Content Display**: Manages the display of number of nights and other text elements based on settings and feature toggles in the store.