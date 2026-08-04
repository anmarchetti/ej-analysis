## Imports

The `FlightDetails` component uses several imports:

- `FunctionComponent` from `react`: Used to type the component as a React functional component.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `DATE_FORMATS` from `code/dates`: A constant that likely contains different date formats.
- `formatDateL10n` from `frontend/utils/date.utils`: A utility function for localizing and formatting dates.
- `IRoute` from `models/data/IRoute`: A TypeScript interface defining the structure of route data.
- `SVGDepartureFilled` from `frontend/components/icons-new/DepartureFilled`: A React component for the departure icon.
- `styles` from `./FlightDetails.module.scss`: Module CSS for styling the `FlightDetails` component.

## Structure

The `FlightDetails` component is defined as a functional component using TypeScript. It accepts `IFlightDetailsProps` as props, which include:

- `flightRoutes`: An array of `IRoute`, representing the outbound and inbound flight routes.
- `className`: An optional string for CSS class names to be applied to the container.
- `dataTid`: An optional string for a data attribute used for testing purposes, defaulting to `'flight-details'`.

The component structure includes:

- A top-level `div` with a `data-tid` attribute.
- Two inner `div` elements representing outbound and inbound flights, each containing:
  - An `SVGDepartureFilled` icon.
  - A `span` for the airport name (`depName` from `IRoute`).
  - A `span` for the departure date, formatted using `formatDateL10n`.

## Logic

The component logic primarily involves formatting and displaying data:

- The `flightRoutes` array is destructured into `outbound` and `inbound` objects.
- The `depDate` from both `outbound` and `inbound` routes are formatted using `formatDateL10n` with the `DATE_FORMATS.dateMonthTime` format.
- Conditional class names are applied using `classNames`, combining `className` prop with styles from the SCSS module.
- The `SVGDepartureFilled` icon for the inbound flight has an additional class `icon--reflect-x` to presumably flip the icon horizontally.

This component is designed to display detailed information about flight routes, including departure names and times, in a styled format.