## Imports

The `AmendHotelOfferCardFooter` component imports several modules and components which are categorized into different types as follows:

- **React and Utilities:**
  - `FunctionComponent` from `react` - This is used to type the functional component.
  - `classNames` from `classnames` - A utility to conditionally join class names together.

- **Custom Hooks and Store:**
  - `useMobileViewport` from `frontend/hooks/useMediaQuery` - A custom hook to check if the viewport is mobile-sized.
  - `useStore` from `frontend/hooks/useStore` - A custom hook for accessing the Redux store.

- **Models and Types:**
  - Various models and interfaces such as `IAmendHotelOffer`, `IHotel`, `IOffer`, `ISitecoreField` from the `models` directory.
  - Enumerations like `CalloutOrientation`, `CalloutPosition`, and `SitecoreDictionary` from `models/enum`.

- **Components:**
  - `HotelPreviewLink`, `Button`, `Callout`, `FreeForKidsPill` from `frontend/components/common` - These are reusable UI components used within the footer component.

- **Utilities and Constants:**
  - `SignDisplay` from `code/currency` - Constants related to currency display.
  - `getPricePostfix`, `isFreeForKids` from `frontend/utils` - Utility functions for price formatting and offer evaluations.

- **Styles:**
  - `styles` from `./AmendHotelOfferCardFooter.module.scss` - Module CSS for styling the component.

## Structure

The `AmendHotelOfferCardFooter` component is structured with the following props:

- `amendHotelOffer`: An object representing the hotel offer to be amended.
- `offer`: The current offer object.
- `onSelectHotel`: A function to handle the selection of a hotel.
- `fields`: Optional fields containing localized strings for UI elements.

The component utilizes a combination of custom hooks for accessing store data and managing state based on the viewport size. It conditionally renders UI elements like buttons and informational pills based on the properties of the offer and the device being used (mobile or desktop).

## Logic

The component's logic is divided into several key areas:

1. **Store Data Extraction:**
   - Uses the `useStore` hook to extract methods and data from the Redux store, such as phrases for localization, money formatting functions, and navigation functions.

2. **Conditional Rendering:**
   - Checks if `fields` prop is provided; if not, it returns `null` to prevent rendering.
   - Determines if the `FreeForKidsPill` should be shown based on the `isFreeForKids` utility function.

3. **Price Formatting:**
   - Formats the offer's price using the `formatMoney` function with specific options for currency display.

4. **Event Handlers:**
   - `handleHotelPreviewClick` and `handleMobileHotelPreviewClick` are defined to handle clicks on the hotel preview link, with special handling for mobile devices by checking the `isMobile` state.

5. **UI Composition:**
   - Constructs the UI with a combination of divs, paragraphs, and custom components. It uses conditional rendering for elements like the `Callout` for tooltips and `FreeForKidsPill`.
   - Utilizes the `classNames` utility for conditional class assignment, especially for responsive design considerations.

This component is a typical example of a complex React functional component that integrates business logic, UI rendering, and responsiveness to create a dynamic user experience based on the provided props and global state.