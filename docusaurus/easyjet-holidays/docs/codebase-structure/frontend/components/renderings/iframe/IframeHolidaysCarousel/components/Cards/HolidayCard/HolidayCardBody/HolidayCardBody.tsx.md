### Imports

The component imports are categorized into several types:

- **React and Hooks:**
  - `FC` (Function Component) and `Fragment` from `react` are used to define the component type and to render multiple elements without adding extra nodes to the DOM.
  - `useStore` is a custom hook imported from `frontend/hooks/useStore` for accessing the Redux store state.

- **Utility Functions and Types:**
  - `getRouteByDirection` from `frontend/utils/airports.utils` helps in determining outbound and inbound flight routes.
  - `filterPackageIcons` from `frontend/utils/offer.utils` is used for filtering icons based on the offer details.

- **Data Models and Enums:**
  - `IOffer` from `models/data/IOffer` represents the offer data structure.
  - `MediaSize` from `models/data/MediaSizeParams` and `HolidayThemesTypesCodes` from `models/enum/HolidayThemes` are used for defining media sizes and holiday theme codes respectively.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` contains dictionary entries for localization or specific string values.

- **Components:**
  - `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext` is a component for rendering images.
  - `HolidayCardCTA`, `HolidayCardFlight`, and `HolidayPrice` are custom components located under `./components/` directory, specifically designed for displaying various aspects of a holiday package.

- **Styles:**
  - `styles` from `./HolidayCardBody.module.scss` contains CSS modules for styling the component.

### Structure

`HolidayCardBody` is a functional component that accepts `IHolidayCardBodyProps` as props, which include:

- `hotelLink`: URL string to the hotel.
- `isLuxuryPackage`: Boolean indicating if the package is a luxury package.
- `offer`: Object containing details about the holiday offer.
- `shouldShowPrice`: Boolean to determine if the price should be displayed.

The component structure consists of three main blocks within a `div` with a class `cardBody`:

1. **Price and Icons Block:**
   - Displays filtered package icons.
   - Conditionally displays the price of the holiday package if `shouldShowPrice` is true.

2. **Flight Details Block:**
   - Shows flight details for both outbound and inbound routes using the `HolidayCardFlight` component.
   - A horizontal divider separates the outbound and inbound flight details.

3. **Call to Action (CTA) Container:**
   - Contains the `HolidayCardCTA` component which likely includes links or actions users can take related to the holiday package.

### Logic

1. **Store Hook:**
   - `useStore` hook is utilized to extract `getPhrase` function from the `layoutStore`, which is probably used to fetch localized phrases or labels.

2. **Icon Filtering:**
   - Icons related to the package are filtered using the `filterPackageIcons` utility, which considers various conditions such as transfers, extra luggage, and whether it's a luxury package.

3. **Flight Route Calculation:**
   - The `getRouteByDirection` utility is used to separate the flight routes into `outbound` and `inbound`.

4. **Conditional Rendering:**
   - The price of the holiday is conditionally rendered based on `shouldShowPrice`.
   - Icons and other elements have conditional attributes and classes for accessibility and styling purposes, such as `visually-hidden` which likely keeps the element accessible to screen readers while being invisible in the UI.

This component effectively combines data handling, business logic, and presentation, suitable for representing a holiday package card in a travel booking application.