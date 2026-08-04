### Imports

The `ItineraryHotel` component utilizes several imports which are categorized into React APIs, third-party libraries, hooks, utility functions, models, and other components:

- **React APIs:**
  - `FC` (Function Component) and `useState` from `react` for component and state management.

- **Third-party libraries:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering Sitecore managed text fields.
  - `classNames` for conditional class name management.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.

- **Custom hooks:**
  - `useMobileViewport` to check if the viewport is of mobile size.
  - `useStore` to access MobX store values.

- **Utility functions:**
  - `copyToClipboard`, `buildHotelDetailsUrl`, `getHotelAddress`, `getHotelCoordinates`, `buildGetDirectionsGoogleMapsUrl` for various data manipulations and URL constructions.
  - `getRoomsMeta` to derive metadata from room details.
  - `getHotelMeta` to extract and format hotel-related data from the booking object.

- **Models:**
  - `IBookingInfo` and `IUnit` for typing the booking and unit data structures.
  - `ISitecoreField` for typing Sitecore managed fields.

- **Components:**
  - `Button`, `StarRating`, `SvgChevronRight`, `SvgCopySimple`, `SvgHotelFilled`, `TripadvisorInfo`, `GetDirectionsPopup`, `ItineraryItem`, `ItineraryItemSubtitle` for structuring and managing various parts of the UI.

- **Styles:**
  - `styles` from `./ItineraryHotel.module.scss` for CSS module styles specific to this component.

### Structure

The `ItineraryHotel` component is structured as a functional component utilizing React hooks for state and context management. The component accepts `IItineraryHotelProps` as props for configuration and rendering:

- **Props:**
  - Various Sitecore fields for labels and titles.
  - `booking` object containing detailed information about the hotel booking.
  - `isExpanded` boolean to control expand/collapse state.
  - `setExpanded` function to toggle the expanded state.
  - `className` for custom styling.

- **State:**
  - `isPopupShown` to manage the visibility of the directions popup.

- **Render:**
  - Mainly structured around the `ItineraryItem` component which is used to display the hotel information.
  - Conditionally renders expanded content including hotel address, directions button, and room details.
  - A popup for directions is conditionally rendered based on the `isPopupShown` state and viewport size.

### Logic

- **Data Fetching and Transformation:**
  - Uses `getHotelMeta` and `getRoomsMeta` to fetch and prepare data for rendering.
  - Constructs URLs for hotel details and directions using utility functions.

- **Event Handling:**
  - `onGetDirectionsClick` toggles the visibility of the directions popup on mobile or opens a new tab with directions on larger screens.
  - `onPopupClose` sets `isPopupShown` to false, closing the popup.

- **Responsive Behavior:**
  - Uses `useMobileViewport` to determine if the device is mobile and adjusts UI interactions accordingly (e.g., popup for directions on mobile).

- **MobX Integration:**
  - Utilizes `useStore` to access global state and derive necessary props like `basePath` and phrases from the store, as well as flags indicating the type of package (luxury, flight and hotel).

- **Conditional Rendering:**
  - Based on the `isExpanded` state, additional details about the hotel are rendered.
  - Shows or hides the directions popup based on the `isPopupShown` state and viewport size.

This component effectively combines data management, responsive design, and interactive elements to provide a comprehensive display and manipulation interface for hotel itinerary information within a travel booking application.