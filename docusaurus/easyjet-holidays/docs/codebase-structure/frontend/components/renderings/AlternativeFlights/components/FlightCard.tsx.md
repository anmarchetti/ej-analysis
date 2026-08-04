### Imports

The `FlightCard` component imports several modules and components necessary for its functionality:

- **React** - Base library for building the component.
- **observer from mobx-react** - Used to make the component reactive to MobX store changes.
- **SignDisplay from code/currency** - Constants for currency display options.
- **useStore from frontend/hooks/useStore** - Custom hook to access MobX stores.
- **TStores from frontend/store/IStores** - Type definition for the stores.
- **isTradeStore from frontend/store/tradePortal** - Utility to check if the current store is a trade store.
- **isPricePPShown from frontend/utils/offer.utils** - Utility to determine if the price per person should be shown.
- **IAlternativeOffer from models/data/IAlternativeOffers** - Interface for the alternative offer data model.
- **SitecoreDictionary from models/enum/SitecoreDictionary** - Enum for Sitecore dictionary keys.
- **BlockSelected, Button, Card, FlightErrata, FlightsDetails, PriceLabel from frontend/components/common** - Reusable UI components.
- **SvgEditFilled from frontend/components/icons-new/EditFilled** - SVG icon component.

### Structure

The `FlightCard` component is structured as follows:

- **IFlightCardProps interface** - Defines the props expected by the `FlightCard` component, including booleans for changeability and selection, an offer object, callback functions, and optional props for loading state and data tracking IDs.
- **FlightCard component** - A functional component using `React.forwardRef` for potential ref forwarding. It utilizes the `useStore` hook to derive state and helper functions from the MobX stores. The component is wrapped in an observer to react to MobX state changes.

Within the component:
- A `Card` component wraps the entire content, with conditional styling based on whether the offer is selected.
- The main content includes:
  - **FlightsDetails** - Displays route details.
  - **Action area** - Depending on the state (selected, changeable), different UI elements like buttons and price labels are displayed.
  - **Errata information** - Conditionally displayed if errata information is available and enabled.

### Logic

The main logical flow and functionalities within the `FlightCard` component are:

- **Store Data Extraction**: Using the `useStore` hook, data such as errata visibility, price visibility, phrases for localization, and money formatting functions are extracted from the MobX stores.
- **Conditional Rendering**:
  - **Selection and Changeability**: The UI changes based on whether the flight offer is selected or changeable. This affects what buttons and informational blocks are displayed.
  - **Price Visibility**: Depending on the store configuration and the type of offer, the price might be displayed differently (e.g., per person).
- **Event Handling**:
  - **Select and Change Actions**: Callbacks for selecting a new offer or changing the current offer are triggered through buttons, which are disabled and show loading indicators based on the loading state.
- **Errata Display**: If enabled and data is present, flight errata information is shown using the `FlightErrata` component.

This component effectively combines UI elements, store interactions, and conditional logic to provide a dynamic and responsive experience for flight offer selections and modifications.