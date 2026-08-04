### Imports

The `FeaturedHotelCardInfo` component utilizes a variety of imports from external libraries and internal modules:

- **React Imports:**
  - `React`: Base React library.
  - `FC` (Function Component): Type from React for functional components.
  - `useRef`: React hook to create mutable object which holds a reference to a DOM element.

- **MobX Imports:**
  - `observer`: Function from MobX-react for making a React component reactive to MobX state changes.

- **Internal Utilities and Hooks:**
  - `Tokens`, `Tokenizer`: Utilities for handling token replacements in strings.
  - `usePriceLabels`, `useStore`: Custom React hooks for accessing MobX store and price label configurations.
  - `getDiscount`, `getDiscountPerPerson`: Utility functions to calculate discounts.
  
- **Store and Model Imports:**
  - `TStores`: Type definition for the MobX stores.
  - `isTradeStore`: Utility function to check if the current store is a trade store.
  - `IFeaturedHotelsWithPrice`: Interface for the hotel data model.

- **Component and Enum Imports:**
  - `SitecoreDictionary`: Enum for dictionary keys used to fetch localized phrases.
  - `PromoBadge`, `StarRating`, `LivePrice`: Reusable React components for displaying specific UI elements.

### Structure

The `FeaturedHotelCardInfo` component is structured as follows:

- **Props Definition (`IFeaturedHotelCardInfoProps`):**
  - `hasLivePrice`: Indicates if live pricing should be shown.
  - `hotel`: Object containing details about the hotel.
  - `displayNumberOfNights`: Flag to display the number of nights.
  - `infoBlockHeight`: Optional height for the info block element.

- **Functional Component Definition:**
  - Uses React functional component pattern with destructured props for readability.
  - A `useRef` hook is used to hold a reference to the component's root div element for potential DOM manipulations or access.

- **Reactive Data Fetching:**
  - `useStore` hook is used to extract necessary methods and values from the MobX store.
  - Conditions check if the store is a trade store and accordingly decide the visibility of prices.

- **Conditional Rendering:**
  - Early return of `null` if the `hotel` prop is not provided.
  - Various conditions to determine the display of number of nights, promotional descriptions, and live pricing components.

### Logic

The component's logic primarily revolves around the display and formatting of hotel information, including pricing and promotions:

- **Night Count and Pricing Information:**
  - The number of nights is determined from the `hotel` object and displayed using a dynamic label that adjusts based on the count.
  - `renderBookFrom` dynamically constructs the text showing booking information, integrating live price visibility and number of nights.

- **Promotional Description Handling:**
  - A self-invoking function determines the promotional description to be displayed, incorporating discounts per booking or per person using token replacement.
  
- **Component Rendering:**
  - The main return statement of the component lays out the structure of the hotel card, including:
    - Promotional badge (if applicable).
    - Hotel name.
    - Star rating and destination information.
    - Conditional rendering of the booking and price information based on various flags and store states.

- **Styling and Accessibility:**
  - Inline styles are applied for minimum height.
  - `data-tid` attributes are used likely for testing purposes to identify elements easily.

This component is wrapped with `observer` from MobX-react to make it reactive to state changes in the MobX stores, ensuring that it updates when relevant store data changes.