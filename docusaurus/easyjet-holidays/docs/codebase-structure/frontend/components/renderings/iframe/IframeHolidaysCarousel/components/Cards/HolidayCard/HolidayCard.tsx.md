## Imports

The component imports various modules and components necessary for its operation:

- **React Imports**: Utilizes `FC` (Function Component) and `useMemo` from the React library.
- **Hooks and Store**: Imports `useStore` custom hook for accessing the Redux store state, specifically configured for the frontend application.
- **Utility Functions**:
  - `buildHotelDetailsUrl` function for constructing hotel detail URLs.
  - `containsLuxuryPromoCode` function to check if the offer includes a luxury promo code.
- **Type Definitions**:
  - `IHolidaysStores` for typing the structure expected from the holiday-related stores.
  - `IOffer` for typing the offer object passed to the component.
- **Child Components**:
  - `HolidayCardBody`, `HolidayCardHeader`, and `HolidayCardImage` for rendering specific parts of the holiday card.
- **Styling**:
  - Imports CSS module styles from `HolidayCard.module.scss` for styling the component.

## Structure

The `HolidayCard` component is structured into three main parts, each represented by a child component:

1. **HolidayCardImage**: Displays the image of the holiday destination. It takes the offer, a fallback image URL, and a flag indicating if it's a luxury package.
2. **HolidayCardHeader**: Shows header information like the destination name. It receives the offer and the computed hotel link URL.
3. **HolidayCardBody**: Contains detailed information about the holiday offer including pricing and other details relevant to the offer. It also receives the offer, hotel link URL, a flag if the price should be shown, and a flag for luxury packages.

The component itself is wrapped in a `div` with a class derived from the imported `styles` object, ensuring that it adheres to the defined CSS module styling.

## Logic

The component's logic revolves around the computation and conditional rendering based on the props and store state:

- **Store State Access**: Uses the `useStore` hook to extract `basePath` and `buildHotelQueryPromotingIframe` from the store. `basePath` is used as a base URL for links, and `buildHotelQueryPromotingIframe` is a function to build query strings for URLs based on the offer.
- **URL Computation**: Utilizes `useMemo` to memoize the computation of the `hotelLink`. The link is constructed using the `basePath`, `buildHotelDetailsUrl`, and the query returned from `buildHotelQueryPromotingIframe`.
- **Luxury Package Detection**: Checks if the offer includes a luxury promo code using the `containsLuxuryPromoCode` utility function. This boolean result is used to conditionally render parts of the component and is passed to child components.
- **Conditional Rendering**: The `HolidayCardBody` component receives a prop to conditionally display the price based on `shouldShowPrice`.

This structure and logic ensure that the component is both efficient (due to memoization and conditional rendering) and modular, with clear separation of concerns among the child components.