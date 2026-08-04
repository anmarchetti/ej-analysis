### Imports

The component `BasketSecondCellAB` imports several dependencies:

- **React and React Functional Component:** Utilizes React library and its Functional Component (FC) for building the component.
- **classNames:** A utility function to conditionally join class names together. Used for dynamic class assignment.
- **observer from mobx-react:** Enhances the component to reactively update when observables that are used in the component change.
- **Constants and Utilities:**
  - `DATE_FORMATS` from `code/dates`: Constants for date formats.
  - `useStore` from `frontend/hooks/useStore`: A custom React hook for accessing MobX stores.
  - Utility functions from `frontend/utils` for handling dates, routes, and accommodation specifics.
- **Type Definitions and Enums:**
  - `TStores` from `frontend/store/IStores`: Type definition for the MobX stores.
  - `IOfferWithoutAltBoards` and `IRoute` from `models/data`: Interfaces defining the structure for offers and routes.
  - `RouteDirection` enum from `models/enum`: Enumeration for route direction.
- **SVG Icons:**
  - `SVGCalendarLined` and `SVGDepartureFilled` from `frontend/components/icons-new`: React components for SVG icons.
- **CSS Module:**
  - `styles` from `./BasketVerticalCellsAB.module.scss`: Scoped CSS module for styling.

### Structure

The `BasketSecondCellAB` is a functional React component that accepts props:

- **IBasketSecondCellABProps:**
  - `className`: A string to apply custom class styling.
  - `offer`: An object conforming to `IOfferWithoutAltBoards` interface, containing details about the offer.

The component utilizes a MobX store hook `useStore` to extract methods and states:

- `getPhrase`: A method to retrieve phrases for localization.
- `isScreenExtraSmall`: A boolean state indicating if the screen size is extra small.

The component calculates and conditionally renders the following data:

- **Outbound and Inbound Routes:**
  - Extracted from the `offer.transport.routes` array based on their direction.
- **Departure Dates:**
  - Formatted departure dates for both outbound and inbound routes.

The component's JSX structure includes:

- A `div` container with a dynamic class name.
- An unordered list (`ul`) with list items (`li`) that display:
  - Icons for calendar and departure.
  - Duration of the stay.
  - Departure and arrival information based on screen size and availability of route data.

### Logic

The component's logic revolves around extracting and formatting data from the `offer` prop:

1. **Extracting Routes:**
   - Filters the `offer.transport.routes` based on the route direction (Outbound or Inbound) using the `getSingleRoute` utility function which returns the first route that matches the condition.

2. **Formatting Dates:**
   - Uses `formatDateL10n` utility to format the departure dates of the routes based on predefined date formats stored in `DATE_FORMATS`.

3. **Conditional Rendering:**
   - Checks if the screen size is extra small to determine which property (`depName` or `depPt`) to display for departure and arrival points.
   - Uses `classNames` to dynamically assign classes based on conditions (e.g., making text bold).

4. **Localization and Icons:**
   - Retrieves localized phrases using `getPhrase`.
   - Renders SVG icons conditionally and applies transformations (like reflection for the inbound icon).

The component is wrapped with `observer` from `mobx-react` to ensure it reacts to changes in the MobX state used within.