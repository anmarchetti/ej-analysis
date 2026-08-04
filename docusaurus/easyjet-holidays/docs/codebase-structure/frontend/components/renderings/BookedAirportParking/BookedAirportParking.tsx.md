## Imports

The component imports several modules and utilities to function correctly:

- **React and MobX**: Utilizes React's `FC` (Functional Component) for component definition and MobX's `observer` for reactive state management.
- **Sitecore JSS**: Imports `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **Utilities and Constants**:
  - Date utilities (`formatDateL10n`, `getTimeWithoutSeconds`) and string utilities (`convertHtmlToTextWithReplacingBRsWithSpaces`) are imported to format and manipulate data.
  - `DATE_FORMATS` provides predefined date formats.
- **Store Hooks and Models**:
  - `useStore` custom hook for accessing MobX stores.
  - `IHolidaysStores` interface for type definition of holiday-related stores.
  - `BookingStatus` enum for referencing booking statuses.
  - `ISitecoreComponent`, `ISitecoreField`, and `ISitecoreLink` for type definitions related to Sitecore fields and components.
- **Components**:
  - `Button` and `RichTextWithLinks` from common frontend components for UI interactions.
  - `SvgCalendar` and `SvgParking` icons for visual representation of data.
- **Styling**: Imports SCSS module `styles` from `./BookedAirportParking.module.scss` for component-specific styles.

## Structure

The component `BookedAirportParking` is structured as follows:

- **Props Interface (`IBookedAirportParkingFields`)**: Defines the structure for the expected Sitecore fields that the component will receive.
- **Functional Component Definition**:
  - Utilizes the `useStore` hook to extract `isViewBookingPage` and `booking` from the store.
  - Destructures and uses fields from the `fields` prop.
  - Conditional rendering based on the existence of `booking` and `airportParking` data.
  - Extracts and formats data such as parking name, address, and booking period from the `airportParking` object.
  - Constructs URLs and checks conditions to determine the visibility of certain UI elements like buttons and additional text.
- **JSX Layout**:
  - Renders structured data including parking details and booking references using the `Text` component for titles and plain divs for other texts.
  - Conditionally displays a button for car registration and a rich text field for additional information based on the booking status and page context.

## Logic

The component's logic revolves around handling and presenting booking data for airport parking:

- **Data Extraction and Formatting**:
  - Retrieves necessary booking details from the global store and formats dates and times for human-readable display.
  - Sanitizes the address field to replace HTML tags with spaces for safe rendering.
- **Dynamic URL Construction**:
  - Constructs a URL for the car registration button dynamically, appending booking reference and surname as query parameters.
- **Conditional Rendering**:
  - Checks if the booking exists and if the airport parking data is available to proceed with rendering the component.
  - Determines the visibility of the car registration button and additional informational text based on whether the page is a booking view page and if the booking is not canceled.
- **Event Handling**:
  - Handles the click event on the car registration button to open a new window/tab with the constructed URL.
- **Reactivity**:
  - The component is wrapped with MobX's `observer` to reactively update when relevant observable store data changes, ensuring the UI is consistent with the underlying data state.