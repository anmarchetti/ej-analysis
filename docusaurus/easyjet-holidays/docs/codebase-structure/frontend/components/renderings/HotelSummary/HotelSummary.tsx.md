## Imports

The `HotelSummary` component imports various modules and components necessary for its functionality:

- **React Essentials & Hooks**: Imports `FC` (Functional Component type), `useContext`, and `useState` from `react` for component creation and state management.
- **MobX**: Uses `observer` from `mobx-react` for making the component reactive to MobX store changes.
- **Contexts & Hooks**: Imports `BookingContext` for accessing booking data, `useMobileViewport` for responsive behavior, and `useStore` for accessing MobX stores.
- **Store and Utilities**: Imports types and utility functions such as `IHolidaysStores` for type definitions of stores, and `containsLuxuryPromoCode` & `isSitecoreCheckboxSelected` for specific business logic checks.
- **Sitecore Models**: Imports various interfaces and types like `ISitecoreComponent`, `ISitecoreField`, and `TSitecoreCheckboxValue` for typing Sitecore related data.
- **Component Specific Fields**: Imports field types from other components like `ICabinBagsInfoFields`, `IFastTrackInfoFields`, and `ILuggageInfoFields`.
- **Common Components**: Imports reusable UI components such as `Button`, `Drawer`, `LuxuryWrapper`, and `Popup`.
- **Local Components**: Imports `HotelSummaryDetails` and `HotelSummaryPreview` which are sub-components used within this component.
- **Styling**: Imports a CSS module `styles` for scoped styles specific to this component.

## Structure

The `HotelSummary` component is structured as follows:

- **Type Definitions**: Defines TypeScript interfaces and types for the props and fields expected by the component.
- **Functional Component Definition**: `HotelSummary` is a functional component using React hooks for state management and context for accessing global state.
- **Sub-component Data Preparation**: Extracts and prepares data from props and booking context to be passed into sub-components like `HotelSummaryDetails` and `HotelSummaryPreview`.
- **Responsive Behavior**: Uses `useMobileViewport` to determine if the device is mobile and renders UI elements conditionally based on this.
- **Luxury Wrapper**: Conditionally wraps content in a `LuxuryWrapper` if the booking includes a luxury package.
- **Rendering Logic**: Depending on the props and the state, it conditionally renders different UI elements such as buttons, drawers, or popups to show booking details.

## Logic

The core functionality and logic of the `HotelSummary` component can be summarized as:

- **State Management**: Manages the visibility of the hotel details through local state `isDetailsShown`.
- **Context Usage**: Utilizes `BookingContext` to access the current booking data.
- **Conditional Rendering**: Based on the `ShowButtonOnly` and `IsOpeningPopupLinkVisible` parameters, it decides whether to show just a button or the summary preview directly.
- **Luxury Check**: Determines if the booking is a luxury package using `containsLuxuryPromoCode`.
- **Data Passing**: Passes extracted and computed data to `HotelSummaryDetails` and `HotelSummaryPreview` for detailed and preview displays respectively.
- **Responsive UI**: Renders different components (`Drawer` for mobile and `Popup` for non-mobile) based on the viewport size to accommodate different device displays.
- **Event Handling**: Handles user interactions such as button clicks to show or hide details using the `toggleShowDetails` function.

This component effectively encapsulates the logic for displaying a hotel summary with responsive and conditional features, while leveraging global state and utilities to manage data and interactions.