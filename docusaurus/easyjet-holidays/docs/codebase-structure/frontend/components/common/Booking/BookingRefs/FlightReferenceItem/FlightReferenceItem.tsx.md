## Imports

The `FlightReferenceItem` component imports various modules and components which are essential for its operation:

- **React and FC**: Imports the `FC` type from `react` for functional component typing.
- **Hooks**: Utilizes the `useStore` custom hook from `frontend/hooks/useStore` for accessing the Redux store.
- **Utilities**:
  - `copyToClipboard` from `frontend/utils/clipboard.utils` is used to copy text to the clipboard.
  - `getFlightsReferences` from `frontend/utils/route.utils` is used to extract flight reference numbers from the flights data.
- **Models**:
  - `IRoute` from `models/data/IRoute` represents the interface for flight route data.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` contains dictionary keys for text translations.
  - `ISitecoreField` from `models/sitecore/generic/ISitecoreField` represents a generic interface for Sitecore fields.
- **Components**:
  - `MultipleFlightReferenceItem` and `ReferenceItem` from `frontend/components/common/Booking/BookingRefs` are used to render UI elements for multiple and single flight references respectively.
- **Styles**: Imports CSS module styles from `./FlightReferenceItem.module.scss` for styling the component.

## Structure

The `FlightReferenceItem` component is a functional component typed with `FC` from React, accepting `IReferenceItemProps` as its props. These props include:

- `flights`: An array of `IRoute` objects representing the flight data.
- `hasTooltips`: A boolean indicating if tooltips should be displayed.
- `scrollToSeeFullReferences`: An optional `ISitecoreField<string>` that may contain additional data or actions related to scrolling behavior.

The component utilizes conditional rendering to decide whether to display a single flight reference, multiple flight references, or a no-flight information section based on the data provided.

## Logic

1. **Store Access**:
   - The component uses `useStore` to extract `getPhrase` function from the `layoutStore`. This function is used to retrieve localized phrases based on keys from the `SitecoreDictionary`.

2. **Reference Extraction**:
   - `getFlightsReferences` is called with the `flights` prop to obtain an array of flight reference strings.

3. **Conditional Rendering**:
   - If there are multiple flight references (`flightsRefs.length > 1`), the `MultipleFlightReferenceItem` component is rendered.
   - For a single flight reference (`flightsRefs.length === 1`), the `ReferenceItem` component is rendered with props set for displaying the flight reference and possibly a tooltip. It also includes an `onClick` handler to copy the reference number to the clipboard.
   - If there are no valid flight references, a no-flight information section is displayed using a `div` with text elements indicating the absence of flight information.

Each branch of the conditional rendering uses phrases fetched from the `SitecoreDictionary` to ensure the text is localized and appropriate for the context. The component also handles user interaction by enabling the copying of flight reference numbers to the clipboard in the single flight scenario.