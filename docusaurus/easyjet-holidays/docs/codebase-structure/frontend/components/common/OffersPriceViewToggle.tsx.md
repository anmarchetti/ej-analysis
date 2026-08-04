## Imports

The component imports several modules and utilities necessary for its operation:

- `React`: The base library for building the component.
- `observer`: A function from `mobx-react` for making the component reactive to MobX state changes.
- `useStore`: A custom hook defined in `frontend/hooks/useStore` for accessing MobX stores.
- `isHolidayStore`: A function defined in `frontend/store/holidays` that possibly checks if the current store is related to holidays.
- `SiteSettings`: An enumeration from `models/enum/SiteSettings` that contains various configuration settings keys.
- `Checkbox`: A UI component from `frontend/components/common/Checkbox` used for rendering a toggle switch in the UI.

## Structure

The component `OffersPriceViewToggle` is a functional React component that utilizes MobX for state management:

- **State Management**: The component uses the `useStore` custom hook to extract necessary state and actions from the MobX stores. It destructures various properties and methods from the store that are used to determine the UI and behavior of the component.
- **Conditional Rendering**: The component conditionally renders based on the state derived from MobX stores and the business logic contained within the component.
- **UI Component**: Uses the `Checkbox` component to render the toggle UI, with labels that change based on the screen size and the current state of the price view.

## Logic

### Store Data Extraction

The component extracts a variety of data from different stores:

- Flags indicating the type of the current page (shortlist, search results, promo).
- Settings and flags related to pricing view and user interactions.
- Quantities related to booking details.
- Methods to modify the state of the application based on user interactions.

### Conditions for Display

The component calculates two main conditions to determine if it should be rendered:

1. **isShownOnShortlistPage**: True if the current page is a shortlist page and there are any non-expired offers for multiple persons.
2. **isShownOnOfferResultsPage**: True if the current page is either a search results page or a promo page, and the total number of guests (adults plus children, considering if kids go free) is greater than one.

### Event Handlers

- **onPriceViewChange**: A handler that toggles the price view between per person and total price when the checkbox is toggled. It also updates the price filter setting based on the current price view.

### Rendering

- The component uses the `Checkbox` component to render a toggle switch. The labels for the toggle are determined based on the screen size and the settings from `SiteSettings`.
- The component only renders if either `isShownOnShortlistPage` or `isShownOnOfferResultsPage` is true and the price view toggle feature is enabled.

### Usage of MobX `observer`

- The component is wrapped with `observer` from `mobx-react`, which makes the component reactive to changes in the MobX state used within the component. This ensures that the component re-renders whenever relevant parts of the state change.