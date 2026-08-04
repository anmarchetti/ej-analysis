### Imports

The `ParkingDetailsPopup` component imports several modules and components which are categorized as follows:

- **React and MobX**: 
  - `FunctionComponent` and `ReactNode` from `react` for typing components and their props.
  - `observer` from `mobx-react` for making the component reactive to observable data.

- **Utility and Store Hooks**:
  - `useStore` custom hook for accessing MobX stores.
  - `useAirportParkingLocalStore` specifically for accessing local state related to airport parking.

- **Components**:
  - `Button` and `FullScreenPopup` from `frontend/components/common` for UI elements.
  
- **Styling**:
  - `styles` from `./ParkingDetailsPopup.module.scss` for CSS module styling.

- **Models and Enums**:
  - `SitecoreDictionary` for accessing string constants.
  - `ISitecoreField` interface for typing the Sitecore fields.

- **Utilities**:
  - `TrailingZeroDisplay` enum from `code/currency` to specify how trailing zeros in currency should be displayed.
  - `Tokens` and `Tokenizer` from `frontend/utils` for handling string token replacement.

- **Store Interfaces**:
  - `IHolidaysStores` interface to type the stores expected in the `useStore` hook.

### Structure

The `ParkingDetailsPopup` is a functional component that accepts props defined by the `IParkingDetailsPopup` interface:

- **Props**:
  - `ParkingDetailsViewBackButtonText` and `ParkingDetailsViewBackButtonTextMobile`: Text for the back button, differentiated by device type.
  - `promoBanner`: A `ReactNode` for displaying promotional content.
  - `title`: Title of the popup.

- **Local Store Usage**:
  - Uses `useAirportParkingLocalStore` for tracking related functionalities.

- **Global Store Usage**:
  - Extracts multiple store functionalities using `useStore` hook, which include phrase fetching, money formatting, currency information, screen size check, parking validation, and toggling the visibility of the parking details popup.

### Logic

- **Conditional Rendering**:
  - The component returns `null` if there are no `selectedAirportParkingDetails`, ensuring that the popup does not render without required data.
  
- **Data Formatting**:
  - Formats the `totalPrice` using `formatMoney` function from the store, which includes currency settings and conditions for displaying trailing zeros.

- **Event Handlers**:
  - `handleOnClose`: Closes the popup.
  - `handleBookNow`: Handles the booking process, which includes tracking the click event, toggling the popup's visibility, and validating the parking details with a success tracking callback.
  - `onSuccessAction`: Tracks additional events upon successful parking validation.

- **Rendering**:
  - The component renders a `FullScreenPopup` with a title, promotional banner, and a custom button for booking. The button text dynamically includes the formatted price using the `Tokenizer` utility.
  
- **Styling**:
  - Uses CSS modules for styling individual components and elements within the popup, ensuring style encapsulation.

This component integrates tightly with the application's state management and tracking systems, providing a user interface for booking airport parking and handling related business logic.