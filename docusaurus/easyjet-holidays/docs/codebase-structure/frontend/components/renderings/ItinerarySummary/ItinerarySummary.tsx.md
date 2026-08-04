## Imports

The `ItinerarySummary` component utilizes several imports from various libraries and internal modules:

- **React Imports:**
  - `FunctionComponent`, `useCallback`, `useState` from `react` for creating functional component and managing state and memoized callbacks.
  
- **Sitecore JSS:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` to render text fields from Sitecore items.
  
- **MobX:**
  - `observer` from `mobx-react` to make the component reactive to observable changes in MobX stores.
  
- **Constants and Hooks:**
  - `HOURS_PER_DAY` from `code/commonNumbers` for constant values.
  - `useStore` from `frontend/hooks/useStore` to access MobX stores.
  
- **Utility Functions:**
  - `isHolidayStore` from `frontend/store/holidays` to check if current store is related to holidays.
  - `getRouteByDirection`, `getTotalHoursDifference` from `frontend/utils` for handling route and date calculations.
  
- **Models and Interfaces:**
  - `ISitecoreComponent` from `models/sitecore/generic` to type-check Sitecore components.
  - `IComponentWithRerenderProps` from `frontend/components/hoc/withRerender` to type-check props related to rerendering.
  
- **Child Components:**
  - `Button`, `ItineraryAirport`, `ItineraryFlight`, `ItineraryHotel`, `ItineraryTransfer` from respective paths for rendering specific parts of the itinerary.
  
- **Styling:**
  - `styles` from `./ItinerarySummary.module.scss` for CSS module styles.

## Structure

The `ItinerarySummary` component is structured into several key parts:

- **Type Definitions:**
  - `TItinerarySummaryProps` combines props from higher order components and Sitecore components.
  - `ItineraryItemType` an enumeration to define types of itinerary items like flights, transfers, etc.

- **Component Definition:**
  - `ItinerarySummary` is defined as a functional component using React hooks for state and effects.

- **State Management:**
  - `expandedItems` state to manage which itinerary items are expanded.

- **Functional Logic:**
  - `toggleExpandedView` and `toggleExpandAll` functions to control the expansion of itinerary items.

- **Conditional Rendering:**
  - Early return of `null` if essential props are not available.
  - Dynamic rendering based on conditions like luxury package availability, and proximity to departure date.

- **Component Composition:**
  - Composes child components like `ItineraryAirport`, `ItineraryFlight`, etc., passing props dynamically.

## Logic

The component's logic revolves around managing the display of itinerary details:

- **Store Usage:**
  - Uses `useStore` to extract relevant data from MobX stores like booking details and package type.
  
- **Expansion Logic:**
  - Manages which parts of the itinerary are expanded using an array of `ItineraryItemType`. Utilizes callbacks to modify this state based on user interactions.
  
- **Date Calculations:**
  - Uses utility functions to determine if certain itinerary sections should be grayed out based on the time difference from current date to travel dates.
  
- **Dynamic Props Passing:**
  - `getProps` function constructs props for child components dynamically, including expansion state and callbacks.
  
- **Conditional Styling and Rendering:**
  - Based on the booking details and user interactions, it renders different components and passes conditional styles and flags like `isGreyedOut`.

This component is designed to be highly interactive and responsive to changes in the underlying MobX state, making it dynamic and user-centric in its display and functionality.