### Imports

The `BookingRefs` component imports several modules and components to facilitate its functionality:

- **React and FC (Function Component)**: Imports the React library and the Function Component type from React for defining the component.
- **useStore Hook**: Custom React hook from `frontend/hooks/useStore` used for accessing the Redux store state.
- **isHolidayStore**: A selector function from `frontend/store/holidays/create-stores` that determines if the current store state represents a holiday store.
- **copyToClipboard**: A utility function from `frontend/utils/clipboard.utils` used for copying text to the clipboard.
- **IRoute Interface**: An interface from `models/data/IRoute` that defines the structure of route data.
- **SitecoreDictionary**: An enumeration from `models/enum/SitecoreDictionary` that provides keys for translation phrases.
- **ISitecoreField Interface**: An interface from `models/sitecore/generic/ISitecoreField` representing a generic Sitecore field.
- **FlightReferenceItem and ReferenceItem Components**: Custom React components located in the same directory used for displaying specific booking reference information.
- **styles**: Module-specific SCSS styles from `./BookingRefs.module.scss` for styling the component.

### Structure

The `BookingRefs` component is structured as follows:

- **IBookingRefsProps Interface**: Defines the props expected by the `BookingRefs` component, including:
  - `bookingRoutes`: An array of IRoute objects.
  - `referenceNumber`: A string representing the booking reference number.
  - `hasTooltips`: An optional boolean that indicates whether tooltips should be displayed.
  - `scrollToSeeFullReferences`: An optional ISitecoreField string that may contain instructions for scrolling.

- **BookingRefs Component Definition**:
  - The component is defined as a functional component using React's FC type with `IBookingRefsProps` as its props type.
  - Uses the `useStore` hook to derive `getPhrase` and `isFlightAndHotelPackage` from the Redux store.
  - The component returns a `div` element with two child components:
    - `ReferenceItem`: Displays the booking or holiday reference number along with a title and optional tooltip.
    - `FlightReferenceItem`: Displays flight information and handles additional UI logic based on props.

### Logic

The core logic of the `BookingRefs` component includes:

- **Store Data Extraction**:
  - `getPhrase`: Function to retrieve phrases for localization based on keys from `SitecoreDictionary`.
  - `isFlightAndHotelPackage`: Boolean value that determines if the booking includes a flight and hotel package, affecting how data is displayed and labeled.

- **Conditional Rendering and Functionality**:
  - The `ReferenceItem` displays different labels and tooltips based on whether `isFlightAndHotelPackage` is true or false.
  - The `onClick` handler of `ReferenceItem` uses the `copyToClipboard` utility to copy the `referenceNumber` to the clipboard when clicked.
  - The `FlightReferenceItem` is always rendered but may display additional information or behave differently based on `hasTooltips` and `scrollToSeeFullReferences`.

This component effectively combines utility functions, store data, and conditional rendering to provide a dynamic and interactive user interface tailored to the context of the booking (whether it's a simple booking or a holiday package).