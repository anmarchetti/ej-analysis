## Imports

The component `HolidaySummaryFlights` imports various JavaScript modules and TypeScript interfaces for its functionality:

- **React Import:**
  - `FunctionComponent` from `react` for typing the component as a functional component.

- **Utility Functions:**
  - `getRouteByDirection` from `frontend/utils/airports.utils` to determine routes based on the flight direction.
  - `getSelectedSeats` from `frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/AmendDatesSummarySeats.utils` to compute selected seats based on provided data.

- **Interfaces:**
  - `IGuestsAmount` from `frontend/utils/luggage.utils` for typing the structure of guest amounts by type.
  - `IGuestPassenger`, `ITransport`, `IRoute`, and `ISelectedSeat` from `models/data` for typing data structures related to passengers, transport offers, routes, and seat selections.
  - `ICabinBagsInfoFields` and `IFastTrackInfoFields` from `frontend/components/common/Booking` to type the props for cabin bags and fast track information components.

- **Components:**
  - `HolidaySummaryFlightsItem` from `./components/HolidaySummaryFlightsItem/HolidaySummaryFlightsItem` for displaying individual flight items within the summary.

## Structure

The `HolidaySummaryFlights` component is structured as follows:

- **Props:**
  - `flights`: An object of type `ITransport` containing flight details.
  - `guestsAmountByType`: An object of type `IGuestsAmount` detailing the amount of guests by type.
  - `passengers`: An array of `IGuestPassenger` detailing information about each passenger.
  - `cabinBagsInfoFields`: An optional prop of type `ICabinBagsInfoFields` for cabin bag details.
  - `fastTrackInfoFields`: An optional prop of type `IFastTrackInfoFields` for fast track service details.
  - `isLuxuryPackage`: An optional boolean indicating if the package is a luxury package.
  - `selectedSeats`: An optional array of `ISelectedSeat` detailing the selected seats.

- **Component Definition:**
  - `HolidaySummaryFlights` is defined as a functional component using React's `FunctionComponent` type, with `IHolidaySummaryFlightsProps` as its props type.

## Logic

The component logic is encapsulated within the functional component definition:

- **Route and Seat Selection Handling:**
  - Utilizes `getRouteByDirection` to split the `flights.routes` into `outbound` and `inbound`.
  - Uses `getSelectedSeats` to compute `outboundSeats` and `inboundSeats` based on the routes, passengers, and selected seats.

- **Rendering:**
  - The component returns a fragment (`<>...</>`) containing two `HolidaySummaryFlightsItem` components:
    - One for the `outbound` flight, passing relevant props including flight details, seat selections, cabin bag info, and fast track details if the package is luxury.
    - Another for the `inbound` flight with similar props but also includes a `reverse` prop and potentially a tooltip for speedy boarding if it's a luxury package.

- **Data Attributes:**
  - Each `HolidaySummaryFlightsItem` has a unique `dataTid` attribute for easier targeting in tests or DOM manipulation, distinguishing between outbound and inbound flights.