## Imports

The component `AmendFlightsUnavailablePopup` imports several JavaScript and TypeScript modules to facilitate its functionality:

- **React and MobX**: 
  - `FC` from `react`: Function Component type from React for type definition.
  - `observer` from `mobx-react`: Enhances the component to reactively update when observable data changes.

- **Utility and Configurations**:
  - `DATE_FORMATS` from `code/dates`: Constants for date formats.
  - `Tokens` from `code/tokens`: Enum or object containing token identifiers for text replacement.

- **Custom Hooks and Store**:
  - `useStore` from `frontend/hooks/useStore`: Custom hook to access MobX stores.
  - `IHolidaysStores` from `frontend/store/holidays`: Interface representing the shape of the holidays-related stores.

- **Utilities**:
  - `formatDateL10n` from `frontend/utils/date.utils`: Function to format dates based on locale.
  - `Tokenizer` from `frontend/utils/tokenizer`: Utility for replacing tokens in strings.

- **Models**:
  - `IUnavailablePopupFields` from `models/data/IUnavailablePopup`: Interface for the unavailable popup component fields.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent`: Generic interface for Sitecore components.

- **Components**:
  - `UnavailableFlowPopup` from `frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup`: React component for displaying a popup when certain conditions are met.

- **Local Utilities**:
  - `getBookingData` from `./AmendFlightsUnavailablePopup.utils`: Utility function to extract and manipulate booking data relevant to the component.

## Structure

The `AmendFlightsUnavailablePopup` is a functional React component using TypeScript for type safety. It accepts props conforming to `ISitecoreComponent<IUnavailablePopupFields>`, which includes fields necessary for rendering the popup content.

### Component Setup

- The component utilizes the `useStore` hook to extract relevant data from the MobX store, specifically focusing on flight amendment and booking details.
- Conditional rendering is employed to return `null` if essential data (`fields`, `booking`, `isNoAvailableFlightsPopupShown`) is missing, which prevents the component from rendering inappropriately.
  
### Return Statement

- The component returns an instance of `UnavailableFlowPopup`, passing modified `fields` that include dynamic data such as airport names and dates, formatted and token-replaced based on the context (like booking start date and airport names).

## Logic

### Data Extraction and Condition Handling

- The component first checks for the presence of necessary data and decides whether to render the popup based on the `isNoAvailableFlightsPopupShown` flag.
- Data related to the booking and flight amendment process is retrieved and stored locally using destructuring for easier access in subsequent operations.

### Data Manipulation

- The `getBookingData` function is used to extract and format booking data such as departure and arrival airport names and the booking start date.
- The `Tokenizer` utility replaces tokens in the `Title` and `Description` fields with dynamic values like airport names and formatted dates.

### Event Handling

- The `onFlightsPopupClose` function provides a mechanism to close the popup by toggling the `isNoAvailableFlightsPopupShown` flag within the store.

### Reactivity

- The component is wrapped with `observer` from MobX, enabling it to react to changes in observable data used within the component, ensuring that the UI stays up-to-date with the underlying data state.