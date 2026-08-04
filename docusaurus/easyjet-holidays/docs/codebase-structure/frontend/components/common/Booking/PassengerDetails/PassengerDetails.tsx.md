## Imports

The code imports a variety of dependencies, mainly from React, utility functions, data models, components, and styles. Here's a breakdown:

### React
- `FC` (Function Component) from `react` for typing the component.

### Utilities
- `classNames` for conditionally joining class names together.
- `useStore` for accessing the global store.
- `copyToClipboard` for copying text to the clipboard.
- `getIdFromAnchor` to retrieve specific IDs for navigation.
- `groupPassengersByFlightRefs` to organize passengers by their flight references.
- `Tokenizer` for replacing tokens in strings.

### Data Models
- `ILeadPassenger`, `IRoute`, `IGuest` from `models/data` for typing the data structures used in the component.

### Enums
- `SitecoreDictionary` and `SiteSettings` for accessing application-specific settings and dictionary values.

### Components
- `Anchor`, `Tokens`, `ReferenceItem`, `Passenger`, `Button`, `ViewBookingComponentWrapper`, `PassengerDetailsAction` from various directories, used to build parts of the UI.

### Store and Hooks
- `isHolidayStore` to check if the current store state represents a holiday.
- `useAmendPassengersLocalStore` and `withAmendPassengersLocalStore` for managing local state related to amending passengers.

### Styles
- `styles` from `PassengerDetails.module.scss` for component-specific styling.

## Structure

The `PassengerDetails` component is structured as follows:

### Props
Defines `IPassengerDetailsProps` interface for the component props which includes:
- `flights`, `guests`, `isBookingCanceled`, `isCheckInAvailable`, `leadPassenger`, optional flags like `isExternalAgency`, `isLeadLoggedIn`, and handlers like `onAmendPassengerClick`, `showLeadEmailOnly`.

### Functional Component
`PassengerDetails` is a functional component utilizing React hooks for state and effects management. It uses the `useAmendPassengersLocalStore` for tracking actions and `useStore` to derive values from the global store.

### Rendering Logic
1. **Grouping Passengers by Flights**: Passengers are grouped by their flight references using `groupPassengersByFlightRefs`.
2. **Rendering Groups**: Each group of passengers is rendered with flight-specific details and actions, such as copying to clipboard and check-in links.
3. **Conditional Rendering**: Displays different UI elements based on conditions like `isBookingCanceled`, `isCheckInAvailable`, and `hasMultipleFlightsRefs`.
4. **Amend Passengers**: Displays an amend CTA (Call To Action) if conditions are met, using `isAmendCTAVisible`.

### Export
The component is wrapped with `withAmendPassengersLocalStore` for local state management and exported.

## Logic

The component's logic revolves around displaying passenger details for a booking, with the ability to amend passenger details if applicable. Key logical features include:

### Data Handling
- **Passengers Grouping**: Organizing passengers by their respective flight references to handle multiple flights scenario.
- **Settings and Phrases**: Fetching text and settings from the store using `getPhrase` and `getSetting`.

### Interaction
- **Clipboard Interaction**: Functionality to copy the flight reference to the clipboard.
- **Amend Passenger**: Handling the click event to amend passenger details, which includes tracking the action.

### Conditional Displays
- Based on various conditions like whether the booking is canceled, check-in availability, and the presence of multiple flight references, the UI adapts to display relevant information and actions appropriately.

This component is a crucial part of a larger booking system, likely used in a travel or airline booking application, where managing passenger details efficiently and intuitively is key to user satisfaction and system functionality.