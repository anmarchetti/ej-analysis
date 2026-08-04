## Imports

The component `BasketSecondCell` imports several modules and utilities from various sources to function correctly:

- **React and Functional Component (FC)**: Imports React and its Functional Component type for defining the component.
- **classnames**: A utility to conditionally join class names together.
- **observer from mobx-react**: Used for making the React component reactive to MobX state changes.
- **Custom Hooks and Utilities**:
  - `useStore`: A custom hook for accessing MobX stores.
  - `DATE_FORMATS`: Constants for date formats.
  - `getDurationLabel`, `formatDateL10n`, `getSingleRoute`: Utility functions for formatting and retrieving specific data.
- **Type Definitions**:
  - `TStores`: Type definition for the stores used in `useStore`.
  - `IOfferWithoutAltBoards`, `IRoute`: Interface definitions for the offer and route objects.
  - `RouteDirection`: Enum for route directions.
- **Styling and Icons**:
  - `BasketDiagonalCellABStyles`: Module-specific styles.
  - `SVGCalendarLined`, `SVGDepartureFilled`: React components for SVG icons.

## Structure

The `BasketSecondCell` component is structured as follows:

- **Props**:
  - `className`: A string to apply custom classes to the component.
  - `offer`: An object of type `IOfferWithoutAltBoards` representing the offer details.
  - `isABTestingComponent`: An optional boolean indicating if the component is part of an A/B testing scenario.

- **Component Function**:
  - Uses the `useStore` hook to extract `getPhrase` and `isScreenExtraSmall` from the MobX stores.
  - Determines the outbound and inbound routes by filtering and selecting routes from the `offer` prop based on their direction.
  - Formats the departure dates for both outbound and inbound routes using the `formatDateL10n` function and predefined date formats.
  - Returns a JSX structure that displays the departure and arrival details along with icons, and, if not part of an A/B test, the stay duration.

## Logic

- **Data Retrieval**:
  - The component filters the `offer.transport.routes` array to find the outbound and inbound routes using the `RouteDirection` enum.
  - It uses the `getSingleRoute` utility to ensure that only one route per direction is processed.

- **Conditional Rendering**:
  - The `classNames` function is used to conditionally apply the `secondCell` style when `isABTestingComponent` is true.
  - The component conditionally renders the stay duration list item only if `isABTestingComponent` is false.

- **Responsive Behavior**:
  - The display of departure and arrival points (`depName` or `depPt`) is conditional based on the `isScreenExtraSmall` value, optimizing the display for different screen sizes.

- **MobX Integration**:
  - The component is wrapped with `observer` from `mobx-react` to ensure it reacts to changes in the MobX state, particularly useful for reactivity on phrases from `layoutStore` and screen size from `appStore`.

This component effectively combines responsive design, MobX state management, and conditional logic to present travel route information within a user's basket in a dynamic and flexible manner.