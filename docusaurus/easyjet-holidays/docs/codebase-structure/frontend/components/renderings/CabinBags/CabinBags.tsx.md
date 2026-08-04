## Imports

The `CabinBags` component relies on a variety of imports from React libraries, utility functions, hooks, models, and other components to function properly. Here's a breakdown of these imports:

- **React Imports**: 
  - `FC`, `useEffect`, `useMemo`, `useState` from `react` are standard hooks and types for functional components.
- **Utility Imports**:
  - `classNames` from `classnames` is used for conditional class assignment.
- **MobX Imports**:
  - `observer` from `mobx-react` is used to make the component reactive to observable changes.
- **Hook Imports**:
  - `useLuxuryInternalFlight` and `useStore` are custom hooks for accessing specific state and business logic related to flights and application stores.
- **Model Imports**:
  - Various models such as `IAncillariesContentItem`, `ICabinBagsFields`, `ScrollAnchorId`, `WebStorageKeys`, `ISitecoreComponent` define TypeScript types and enums used for type-checking and defining component contracts.
- **Component Imports**:
  - `Ancillaries`, `CabinBagsActionPanel`, `CabinBagsDropdown`, `CabinBagsRouteInfo`, `CabinBagsBanners` are imported to be used within the `CabinBags` component to compose its structure.
- **Style Import**:
  - `styles` from `./CabinBags.module.scss` for applying CSS modules-based styles to the component.

## Structure

The `CabinBags` component is structured as follows:

- **State Management**:
  - `useState` is used to manage the state of the `isCabinBagsDropdownExpanded`.
- **Context Providers**:
  - `OutlineBannerContext.Provider` wraps part of the component to provide theming context to child components.
- **Conditional Rendering**:
  - Various conditions check the status of the flight, booking, and page type to determine what to render, including placeholders during loading, different content based on the flight type, and visibility of certain UI elements based on business rules.
- **Component Composition**:
  - The main render function composes the UI using a combination of custom components like `Ancillaries`, `CabinBagsActionPanel`, `CabinBagsDropdown`, `CabinBagsRouteInfo`, and `CabinBagsBanners`.

## Logic

The component's logic is primarily concerned with handling the display and interaction logic for cabin bags in different contexts (e.g., luxury flight, external flight, post-booking pages):

- **Store Data Extraction**:
  - `useStore` hook is extensively used to extract and compute necessary data from the MobX stores based on the current application state.
- **Price and Promotion Handling**:
  - Computation to determine if prices should be visible, if promotions should be applied, and formatting of the price display.
- **Dropdown Expansion Management**:
  - Logic to handle the expansion state of the cabin bags dropdown, which changes based on user interaction and page type.
- **Effect Hooks**:
  - `useEffect` is used for side effects such as setting promotional visibility based on the theme context.
- **Memoization**:
  - `useMemo` is used to determine the theme of the outline banner based on several conditions, optimizing performance by avoiding unnecessary recalculations.

Overall, the `CabinBags` component integrates tightly with the application's state management and provides a complex and dynamic user experience based on the current state of the booking and page context.