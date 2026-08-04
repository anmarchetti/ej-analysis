## Imports

The `PriceChangeBanner` component uses several imports from different sources:

- **React**: Base library for building the component.
- **classNames**: A utility to conditionally join class names together.
- **observer**: A MobX function to make the component reactive to state changes.
- **TrailingZeroDisplay, Tokens**: Enums or constants used for formatting and token replacement.
- **useStore**: A custom hook for accessing MobX stores.
- **isHolidayStore**: A function to determine if the current store context is related to holidays.
- **TStores, ISitecoreField**: Type definitions for MobX stores and Sitecore fields.
- **Tokenizer**: A utility for replacing tokens in strings.
- **InfoBlock**: A reusable React component for displaying information blocks.
- **styles**: Module-specific styles imported from a SCSS module.

These imports are organized into categories based on their origin and functionality, such as utilities, hooks, models, components, and styles.

## Structure

The `PriceChangeBanner` component is defined as a functional component in React and decorated with the `observer` function from MobX to enable reactive data fetching. It accepts props of type `IPriceChangeBanner`, which optionally includes `ReservationNotificationDescription` and `ReservationNotificationTitle`, both of which are Sitecore fields.

The component uses a custom hook `useStore` to extract necessary state from the MobX stores. The extracted state includes various flags and values related to booking details, seat selection, and extra services.

The component's return logic includes conditional rendering based on several factors such as page type, luxury package status, and the content of the Sitecore fields. If conditions are met, it calculates the total reservation price and updates the description with dynamic data using the `Tokenizer`.

The main JSX returned by the component is an `InfoBlock`, styled with both a specific class and module-specific styles, and populated with dynamic titles and text.

## Logic

The component's logic can be broken down into several key areas:

1. **Conditional Rendering**:
   - The component first checks if it should not render based on the lack of certain conditions (e.g., not being on the hotel details book page, missing Sitecore fields, or the reservation being part of a luxury package). If any conditions are met, it returns `null`.

2. **Price Calculation**:
   - It calculates the total reservation price based on whether the seat map flow is enabled and if seats have been selected, adding up the prices of selected seats and extra luggage.

3. **Dynamic Content**:
   - If the total reservation price is zero, the component also returns `null`, avoiding displaying unnecessary information.
   - If there is a price, it uses the `Tokenizer` to replace tokens in the `ReservationNotificationDescription` with dynamic data, specifically formatting the total reservation price using the `formatMoney` function.

4. **Rendering Content**:
   - Finally, the component renders an `InfoBlock` with the dynamically updated title and description, applying custom styles and additional class names for styling purposes.

This structure ensures that the component remains maintainable and its operations are clear, separating concerns of data fetching, business logic, and presentation.