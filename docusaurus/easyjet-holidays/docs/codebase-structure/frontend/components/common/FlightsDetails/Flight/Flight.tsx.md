### Imports

The Flight component utilizes several imports from various sources:

- **React and Third-Party Libraries:**
  - `FC` from `react`: Used for typing the component as a Function Component.
  - `classNames` from `classnames`: A utility function for conditionally joining class names together.

- **Constants and Hooks:**
  - `DATE_FORMATS` from `code/dates`: Contains constants for date formats.
  - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the Redux store.

- **Utility Functions:**
  - `formatDateL10n` from `frontend/utils/date.utils`: A utility for formatting dates with localization.
  - `getFlightNumberWithCarNumber` from `frontend/utils/route.utils`: A utility for generating a formatted flight number.

- **Models:**
  - `IRoute` from `models/data/IRoute`: Interface representing the route data structure.
  - `RouteDirection` from `models/enum/RouteDirection`: Enum for route direction types.

- **Components:**
  - `TerminalInfo` from `frontend/components/common/FlightsDetails/TerminalInfo/TerminalInfo`: Component displaying terminal information.
  - `SvgDepartureFilled` from `frontend/components/icons-new/DepartureFilled`: React component for the departure icon.

- **Styles:**
  - `styles` from `./Flight.module.scss`: Module CSS for styling the Flight component.

### Structure

The `Flight` component is structured as follows:

- **Props:**
  - `IFlightProps`: Extends properties from `ITerminalInfoProps` (excluding 'terminal') and includes:
    - `route`: Object containing details about the flight route.
    - `isIconOrange?`: Optional boolean to determine if the icon should be orange.
    - `shouldShowTerminal?`: Optional boolean to determine if the terminal information should be displayed.

- **Component Function:**
  - The component uses the `useStore` hook to access specific flags from the store (`isTerminalInformationEnabled`, `isTradePortal`).
  - Extracts and uses route details such as arrival and departure info, flight direction, and terminal details.
  - Conditionally renders elements such as flight number and terminal information based on the store flags and props.

- **Helper Function:**
  - `renderAirportInfo`: A function to render formatted information about the departure or arrival location.

### Logic

- **Store Flags:**
  - The component checks flags from the Redux store to determine features like trade portal access and terminal information display.

- **Conditional Rendering:**
  - Icons are conditionally styled based on the `isIconOrange` prop and the direction of the route.
  - The flight number and terminal information are only displayed based on the conditions provided by the store flags and component props.

- **Date Formatting:**
  - Dates are formatted using the `formatDateL10n` utility, applying localization and predefined formats from `DATE_FORMATS`.

- **Dynamic Class Names:**
  - Uses the `classNames` utility to dynamically apply CSS classes based on conditions such as `isIconOrange`.

- **Accessibility:**
  - Includes `data-tid` attributes for easier targeting in tests or for accessibility tools.

This documentation provides an overview of how the `Flight` component is structured and functions, emphasizing its dependencies, internal structure, and logical flow.