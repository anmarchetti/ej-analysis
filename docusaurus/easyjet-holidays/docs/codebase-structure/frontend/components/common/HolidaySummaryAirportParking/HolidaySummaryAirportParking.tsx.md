## Imports

The code snippet imports various modules and components which are crucial for the functionality of the `HolidaySummaryAirportParking` component:

- **React Functional Component**: `FC` from `react` is imported to define the component as a functional component.
- **Tokens and Utilities**: 
  - `Tokens` from `code/tokens` for replacing tokens in strings.
  - `formatDateL10n` from `frontend/utils/date.utils` to format date strings.
  - `Tokenizer` from `frontend/utils/tokenizer` for token replacement in text.
- **Hooks and Store**:
  - `useStore` from `frontend/hooks/useStore` is used to access Redux store or similar state management.
- **Type Definitions and Interfaces**:
  - `TStores` from `frontend/store/IStores` for typing the store used in `useStore`.
  - `IAirportParking` and `IAirportParkingInfoFields` from `models/data/externalExtras/IAirportParking` and embedded interface definition for props structure.
  - `ISitecoreField` from `models/sitecore/generic/ISitecoreField` to type the Sitecore fields.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values.
- **SVG and Styles**:
  - `SvgParking` from `frontend/components/icons-new/Parking` for the parking icon.
  - `styles` from the local SCSS module for styling the component.

## Structure

The component is structured into two main interfaces and a React functional component:

- **Interfaces**:
  - `IHolidaySummaryAirportParkingProps`: Defines the props expected by the component including `airportParking`, `dataTid`, optional `airportParkingInfoFields`, and `departureAirportName`.
  - `IAirportParkingInfoFields`: Defines the structure for optional information fields related to airport parking, specifically instructions and title fields.
  
- **Functional Component** `HolidaySummaryAirportParking`:
  - Utilizes destructuring to extract values from `props` and `airportParking`.
  - Uses a constant `TIME_LENGTH` to control the substring length for time display.
  - Composes several formatted date and time strings and a conditional title based on the presence of `departureAirportName`.
  - Renders a structured block of HTML elements styled by SCSS modules and includes dynamic data such as titles, names, and instructions.

## Logic

The component's logic primarily revolves around data formatting and conditional rendering:

- **Date Formatting**:
  - The start and end dates are formatted using `formatDateL10n` utility which likely localizes date strings based on user locale.
  - Times are extracted and limited to `TIME_LENGTH` characters to maintain consistency in display.

- **Dynamic Title Generation**:
  - If a `departureAirportName` is provided, the title for the parking information is dynamically generated using the `Tokenizer.replaceToken` to insert the airport name into the parking title field value.
  - If no `departureAirportName` is provided, a default phrase is fetched from `SitecoreDictionary` using `getPhrase` from the store.

- **Rendering**:
  - The component renders a div container with various child divs for displaying the parking icon, title, parking name, date range, and instructions.
  - Each child div uses `data-tid` attributes for testing identification, constructed dynamically using the `dataTid` prop.

This structure and logic ensure that the component is reusable, maintainable, and testable, adhering to modern React development practices.