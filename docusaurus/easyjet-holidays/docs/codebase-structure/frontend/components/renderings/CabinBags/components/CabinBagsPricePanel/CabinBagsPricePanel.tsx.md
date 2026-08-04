## Imports

The component relies on several imports from various libraries and internal modules:

- **React and Sitecore JSS**: The component is built using React (`FC` from `react`) and integrates with Sitecore JSS (`Text` from `@sitecore-jss/sitecore-jss-nextjs`) for content management capabilities.
- **Classnames**: Utilized for conditional class assignment (`classnames`).
- **MobX**: The component is wrapped with an observer from `mobx-react` to enable reactive data patterns.
- **Custom Hooks and Stores**: `useStore` is a custom hook for accessing MobX stores. `TStores` is a type definition for the stores, ensuring type safety when interacting with them.
- **Model Definitions**: Interfaces `IPassengerFlights` and `ICabinBagsFields` define the structure of expected props and data handling.
- **Components**: Several internal components (`AncillariesPassengerType`, `Button`, `IncludedBagsRow`, `LCBAddedRow`, `LCBIsNotAddedRow`) are used to compose the UI.
- **Styling**: SCSS module for styling (`styles` from `./CabinBagsPricePanel.module.scss`).

## Structure

The `CabinBagsPricePanel` is a functional component designed to handle the display and interaction logic for cabin bags pricing within a passenger context. It accepts props defined by `ICabinBagsPricePanelProps`, which include:

- `passenger`: Information about the passenger and their flight.
- `passengerIndex`: Numeric index indicating the passenger's order.
- `fields`: Optional fields related to cabin bags.

The component's structure is composed of several key parts:

- **Conditional Rendering**: Early return of `null` if certain conditions are not met, such as the absence of necessary fields or formatted price data.
- **State and Store Data Extraction**: Utilizes the `useStore` hook to extract relevant data from global stores.
- **Logical Handlers and Conditions**: Includes a `toggleBag` function for adding/removing a bag and conditions to determine the display of certain UI elements.
- **UI Composition**: Combines various internal components and conditionally renders them based on the state and props.

## Logic

The core functionality of the `CabinBagsPricePanel` revolves around managing the display and modification of cabin bag options for a passenger:

- **Data Fetching and Formatting**: Retrieves and formats data such as the price of large cabin bags using methods provided by the `extraLuggage` store.
- **Toggle Logic**: The `toggleBag` function manages the addition or removal of a cabin bag for a passenger. It adjusts the list of luggage items based on whether the current passenger already has a large cabin bag and updates the store accordingly.
- **Capacity Check**: Determines if adding a new bag is permissible based on the maximum allowed quantity (`LCBMaxQuantity`) and the current passenger index.
- **Conditional UI Rendering**: Several conditions influence the UI:
  - Display different rows (`LCBAddedRow`, `LCBIsNotAddedRow`) based on whether the passenger has a large cabin bag.
  - Show or hide the add button based on several factors like cabin bag capacity, booking page status, and synchronization status of the booking.

This component effectively encapsulates the business logic for managing cabin bags in a user-friendly interface, reacting to changes in global state and user interactions.