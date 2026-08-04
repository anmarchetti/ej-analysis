### Imports

The code imports various modules and components from internal and external sources which are crucial for the functionality of the `ParkingCard` component.

- **React and Sitecore JSS**: The `FunctionComponent` from `react` and `Text` from `@sitecore-jss/sitecore-jss-nextjs` are utilized for creating functional components and handling text fields from Sitecore, respectively.
- **Utility and Helper Functions**: Imports like `TrailingZeroDisplay` from `code/currency`, `Tokens` from `code/tokens`, and `useStore` from `frontend/hooks/useStore` are used for formatting currency, token replacement, and accessing the Redux store.
- **Store and Models**: Types and interfaces such as `IHolidaysStores` and `IAirportParking` are imported to type-check the data used within the component.
- **Enums and Constants**: Enums like `TitleFontSizeMobileAndDesktop` and constants from `models/enum/CustomisableComponentsParameters` and `SitecoreDictionary` are used for styling and dictionary values.
- **Components**: Various components such as `Button` and `AirportParkingCardPill` are imported to build the UI.
- **SVG Icons**: SVG components like `SvgParkingCardTypeMeetAndGreat` are used to display specific icons based on the parking type.
- **Local Store Hook**: The `useAirportParkingLocalStore` is a custom hook to manage state specific to the airport parking feature.
- **Styles**: SCSS module styles from `./ParkingCard.module.scss` are imported for styling the component.

### Structure

The `ParkingCard` component is structured as follows:

- **Props**: It accepts `IParkingCardProps` which includes fields for parking card transfers text, more info button text, and the parking data.
- **Parameters**: It defines styling parameters for the title using predefined enums.
- **Functional Component**: Defined as a React functional component using destructured props.
- **Hooks and Context**: Utilizes custom hooks like `useAirportParkingLocalStore` and `useStore` to fetch necessary state and functions from the global store and local context.
- **Local Variables**: Extracts and formats data such as brand image, title, description, and pricing from the `airportParking` prop.
- **Event Handlers**: Defines `onSuccessAction`, `handleParkingDetails`, and `handleSelectParking` to handle interactions like selecting parking options and toggling details modal.
- **Dynamic SVG Rendering**: Based on the parking type, appropriate SVG icons are rendered.
- **JSX Structure**: The component returns a structured JSX layout comprising of an image, title, description, pills for parking types, and action buttons.

### Logic

The component's logic revolves around rendering information about an airport parking option and handling user interactions:

- **Data Formatting and Display**: Formats the total price using the `formatMoney` function and displays it dynamically in the UI. It also conditionally renders text and icons based on the parking type (Meet and Greet, Park and Ride, Park and Stroll).
- **Conditional Rendering**: Features like free cancellation are conditionally rendered based on flags from the store.
- **Event Handling**: Functions like `handleSelectParking` and `handleParkingDetails` manage user actions such as opening the parking details popup and selecting a parking option, including tracking events for analytics.
- **Accessibility and Internationalization**: Uses the `getPhrase` function to fetch localized strings and ensures accessibility by using appropriate ARIA labels and roles.

Overall, the `ParkingCard` component is a comprehensive implementation designed to display detailed information about airport parking options, handle user interactions efficiently, and ensure a user-friendly and accessible interface.