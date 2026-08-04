## Imports

The code imports various modules and components, primarily from React, Sitecore JSS, and custom utilities and components:

- **React Imports:**
  - `FC` from `react`: Used to define the functional component type.
  
- **Sitecore JSS Imports:**
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs`: Used for rendering text fields from Sitecore items.

- **State Management and Observability:**
  - `observer` from `mobx-react`: Enhances the component to react to changes in observables.

- **Utility and Helper Imports:**
  - `DATE_FORMATS` from `code/dates`: Constants for date formats.
  - `getRouteByDirection` from `frontend/utils/airports.utils`: Function to filter routes by direction.
  - `formatDateL10n` from `frontend/utils/date.utils`: Function to format dates based on locale.

- **Model Imports:**
  - `IBookingInfo` from `models/data/IBookingInfo`: Interface representing the booking information structure.
  - `ISitecoreField`, `ISitecoreImage` from `models/sitecore/generic/ISitecoreField`: Interfaces for Sitecore field types.

- **Component Imports:**
  - `SvgAirportLounge` from `frontend/components/icons-new/AirportLounge`: SVG component for the airport lounge icon.
  - `ItineraryFeature`, `ItineraryItem`, `ItineraryItemSubtitle` from various paths under `frontend/components/renderings/ItinerarySummary/components`: Components used to build up the itinerary item display.

- **Styling:**
  - `styles` from `./ItineraryAirport.module.scss`: Module CSS for styling the component.

## Structure

The component `ItineraryAirport` is defined with the following props:

- **Text and Image Fields:**
  - `AirportTitle`, `ArriveByLabel`, `ArriveByText`, `FastTrackIcon`, `FastTrackLabel`, `FastTrackText`: These are all of type `ISitecoreField`, which can contain text or image data fetched from Sitecore.

- **Booking and UI Control:**
  - `booking`: An object of type `IBookingInfo`, containing the details of the booking.
  - `isExpanded`: Boolean to control the expansion state of the component.
  - `setExpanded`: Function to toggle the expansion state.
  - `className`: Optional string for CSS class.
  - `isGreyedOut`: Optional boolean to indicate if the component should appear disabled.

The component structure is primarily based on conditional rendering and the composition of sub-components like `ItineraryItem`, `ItineraryItemSubtitle`, and `ItineraryFeature`.

## Logic

1. **Route Extraction:**
   - Extracts the `routes` from the `booking` object and identifies the `outbound` route using the `getRouteByDirection` utility function.

2. **Date Calculation:**
   - Calculates the time to arrive at the airport by subtracting a fixed number of hours (3 hours in this case) from the departure date.

3. **Conditional Rendering:**
   - If there is no `outbound` route, the component returns `null`.
   - Displays the `AirportTitle` and an icon.
   - Shows the arrival time using `ItineraryItemSubtitle`.
   - If `isExpanded` is `true`, additional details and features (like Fast Track information) are rendered inside the component.

4. **Expansion Handling:**
   - Uses `setExpanded` callback to toggle the display of detailed information when the component is interacted with.

5. **Styling and Accessibility:**
   - Applies conditional styling based on `isGreyedOut` and custom class names passed via `className`.
   - Uses `data-tid` attributes for testing purposes.

The component is wrapped with `observer` from MobX, making it reactive to changes in observables that might affect the rendering.