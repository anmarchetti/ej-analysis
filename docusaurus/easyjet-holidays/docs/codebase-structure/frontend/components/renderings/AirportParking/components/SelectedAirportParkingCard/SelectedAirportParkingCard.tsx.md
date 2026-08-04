## Imports

The `SelectedAirportParkingCard` component utilizes a variety of imports from both internal modules and third-party libraries to function effectively:

- **React and MobX**: 
  - `FunctionComponent` from `react` for typing the functional component.
  - `observer` from `mobx-react` to make the component reactive to state changes in MobX stores.

- **Utility and Helper Functions**:
  - `TrailingZeroDisplay` from `code/currency` for formatting currency values.
  - `DATE_FORMATS` from `code/dates` to specify date formats.
  - `Tokens` from `code/tokens` for replacing tokens in strings.
  - `formatDateL10n` and `getTimeWithoutSeconds` from `frontend/utils/date.utils` for date formatting and manipulation.
  - `Tokenizer` from `frontend/utils/tokenizer` for replacing tokens in template strings.

- **Hooks and Store Access**:
  - `useStore` custom hook from `frontend/hooks/useStore` to access MobX stores.
  - `useAirportParkingLocalStore` from `frontend/components/renderings/AirportParking/stores/airportParkingLocalStore` to manage local state specific to the airport parking feature.

- **Components and Styles**:
  - `Button` from `frontend/components/common/Button` and `SvgCross` from `frontend/components/icons-new/Cross` for rendering buttons and icons.
  - `styles` from `./SelectedAirportParkingCard.module.scss` for component-specific styling.

- **Models and Enums**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` for accessing dictionary values for localization.

## Structure

The `SelectedAirportParkingCard` component is structured as follows:

- **Props**: The component accepts `ISelectedAirportParkingCardProps` which includes:
  - `cardTitle`: Title of the card.
  - `selectedFromDate`: Start date in a formatted string.
  - `selectedToDate`: End date in a formatted string.

- **Local Store and Global Store Access**:
  - Uses `useAirportParkingLocalStore` to access local state specific to the airport parking feature.
  - Uses `useStore` to extract multiple pieces of data from global stores such as `selectedAirportParking`, currency formatting functions, and UI state toggles.

- **Conditional Rendering**:
  - If `selectedAirportParking` is null, the component returns `null`, preventing any further rendering.

- **Data Formatting**:
  - Formats price, start and end dates, and times using utility functions and stored formats.

- **Event Handlers**:
  - `onEdit` and `onRemove` functions handle the edit and remove actions, respectively, including tracking and state updates.

- **JSX Structure**:
  - Renders an image or a placeholder if no image is available.
  - Displays parking details including name, price, and formatted dates.
  - Provides buttons for editing and removing the selected parking option, with associated event handlers.

## Logic

The component's logic primarily revolves around handling and displaying data related to a selected airport parking option:

- **Data Extraction and Formatting**:
  - Extracts necessary data from MobX stores.
  - Formats currency and dates for display using imported utilities.

- **Tracking and State Management**:
  - Implements tracking for user interactions such as editing and removing parking options.
  - Uses local and global state management to toggle UI elements and validate selections.

- **Dynamic Text Replacement**:
  - Uses the `Tokenizer` utility to dynamically replace date and time tokens in the provided `selectedFromDate` and `selectedToDate` props with actual formatted values.

- **Conditional Styling and Elements**:
  - Conditionally renders images and sets CSS classes based on the availability of data, enhancing the UI's responsiveness and adaptability to different states.

This component is designed to be highly modular, leveraging external utilities and internal state management effectively to maintain clean and maintainable code.