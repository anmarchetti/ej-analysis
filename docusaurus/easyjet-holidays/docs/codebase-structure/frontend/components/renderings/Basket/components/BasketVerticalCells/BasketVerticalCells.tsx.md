## Imports

The `BasketVerticalCells` component imports several modules and components to handle its functionality and presentation:

- **React and ClassNames**: Uses the `React` library for building the component and `classNames` for dynamically setting CSS class names.
- **Utility and Hook Imports**: Imports like `useStore` from `frontend/hooks/useStore` for accessing the Redux store, and utility functions such as `resetScrollbarPosition` and `setContainerHeight`.
- **Type Definitions**: Imports various TypeScript interfaces and types such as `CurrencyCode`, `IBoardType`, `IRoomType`, and `IOfferWithoutAltBoards` to define the shape of props and other objects.
- **Component Imports**: Includes specific UI components like `Button`, `StartBookingButton`, and several custom basket-related components (`BasketFirstCell`, `BasketSecondCell`, etc.).
- **Style Import**: The component styles are imported from `./BasketVerticalCells.module.scss` to apply module-specific styling.

## Structure

The `BasketVerticalCells` component is structured into a main React functional component that utilizes several smaller components and logic to render a complex part of the UI, specifically tailored for a shopping basket interface. The component accepts `IBasketVerticalCellsProps` as props, which include various flags and data needed for rendering and interaction, such as `isExpanded`, `isNewSummaryBar`, and `totalPricePP`.

### Main Component Sections:

1. **Header Section**: Includes a title that can be dynamically set based on the new or old summary bar design, and a close button.
2. **Content Section**: Depending on whether the new summary bar is used, it either displays a `SummaryDetails` component or a series of basket cells (`BasketFirstCell`, `BasketSecondCell`, `BasketThirdCell`).
3. **Promo Code Banner**: Displayed when the basket is not expanded, showing promotional messages.
4. **Action Buttons**: Includes a toggle button to expand or collapse the basket details and a price cell. There's also a conditional rendering of the `StartBookingButton` if the next button is visible.

## Logic

### Dynamic Content and Interaction:

- **Title and Button Text**: The text for the main title and the toggle button is dynamically fetched based on whether the new summary bar is used and what content is provided in the `fields` prop.
- **Expansion Logic**: The component allows users to expand or collapse the detailed view of the basket. This is managed by the `isExpanded` state, which is toggled via a button.
- **Conditional Rendering**: Based on various props like `isNewSummaryBar`, `isPriceVisible`, and `isNextButtonVisible`, different parts of the component are rendered. This allows for a flexible component that can adapt to different scenarios and data.
- **Scroll and Height Management**: Functions like `resetScrollbarPosition` and `setContainerHeight` are used to manage the UI's behavior and appearance, ensuring a smooth user experience.

### Utility Functions:

- **getPhrase**: A function used to fetch localized strings from the store, aiding in internationalization.
- **containsLuxuryPromoCode**: Checks if the current offer includes a luxury promo code, affecting the styling and behavior of the booking button.

This component is a complex and crucial part of the UI, handling various user interactions and data presentations based on the provided props and the application's state.