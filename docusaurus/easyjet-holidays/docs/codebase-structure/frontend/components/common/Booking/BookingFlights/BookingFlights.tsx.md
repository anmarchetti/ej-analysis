### Imports

The `BookingFlights` component imports several modules and components which are categorized into React-specific, MobX, custom hooks, store configurations, models, components, and styles:

- **React-specific**: 
  - `FC` (Function Component) from `react` for typing the component.
  - `useEffect` and `useState` from `react` for handling side effects and managing state within the component.

- **MobX**:
  - `observer` from `mobx-react` to make the component reactive to observable changes.

- **Custom Hooks**:
  - `useStore` from `frontend/hooks/useStore` to access MobX stores in a more convenient way.

- **Store Configurations**:
  - `isHolidayStore` from `frontend/store/holidays` to check if the current store is related to holidays.
  - `TStores` from `frontend/store/IStores` for typing the stores.

- **Models**:
  - `IRoute` from `models/data/IRoute` for typing route data.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing string literals.

- **Components**:
  - `FlightsDetails` and `IFlightsDetailsProps` from `frontend/components/common/FlightsDetails/FlightsDetails` for displaying flight details.
  - `ViewBookingComponentWrapper` from `frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper` as a wrapper component.
  - `AmendFlightsButton` from `./AmendFlightsButton/AmendFlightsButton` for providing an interface to amend flights.

- **Styles**:
  - `styles` from `./BookingFlights.module.scss` for CSS modules specific to this component.

### Structure

The `BookingFlights` component is structured as follows:

- **Props**:
  - `IFlightsProps` interface to type the props passed to the component including fields for flight details, routes, optional customer service mask, an optional late checkout banner, and an optional event handler for clicking the amend flights button.

- **Component Definition**:
  - `BookingFlights` is a functional component typed with `FC<IFlightsProps>`.
  - Inside, it uses the `useStore` hook to derive necessary state and functions from the MobX stores.
  - A local state `isAmendFlightsCTAHidden` is managed using `useState` to control the visibility of the Amend Flights button based on certain conditions.

- **UseEffect Hook**:
  - It contains logic to update `isAmendFlightsCTAHidden` based on `isNoAvailableFlightsPopupShown` or `isLuxuryPackage`.

- **Render**:
  - The component renders a `ViewBookingComponentWrapper` which includes:
    - A `FlightsDetails` component to display flight details.
    - An `AmendFlightsButton` conditionally based on `isAmendCTAVisible` and `isAmendFlightsCTAHidden`.
    - An optional `lateCheckoutBanner` if provided.

### Logic

The component's logic revolves around conditional rendering and state management based on the store's state:

- **Store Usage**:
  - The `useStore` hook extracts multiple states and functionalities from the stores such as phrases from `layoutStore`, visibility conditions from `amendFlightsStore`, and package types from `viewBookingStore`.

- **Conditional Logic**:
  - The visibility of the Amend Flights button is determined by a combination of store states (`isNoAvailableFlightsPopupShown`, `isLuxuryPackage`) and local state (`isAmendFlightsCTAHidden`).
  - The `useEffect` hook updates the visibility state (`isAmendFlightsCTAHidden`) whenever relevant dependencies (`isNoAvailableFlightsPopupShown`, `isLuxuryPackage`) change.

- **Data Handling**:
  - `routes` and `fields` props are passed directly to the `FlightsDetails` component for displaying detailed flight information.
  - The `AmendFlightsButton` receives `onAmendFlightsClick` as an event handler prop, allowing parent components to define custom behavior when the button is clicked.

This component effectively demonstrates how to integrate React functional components with MobX for state management, coupled with conditional rendering based on complex business logic.