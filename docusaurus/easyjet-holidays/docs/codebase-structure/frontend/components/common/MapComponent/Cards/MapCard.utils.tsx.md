### Imports

The provided code imports several JavaScript and TypeScript modules, React hooks, components, utilities, and styles, which are essential for the functionality of a map card in a web application:

- **React Hooks:** `useEffect`, `useMemo`, `useState` from 'react' are used for managing state and side effects in functional components.
- **Utility and Helper Functions:** Various utilities like `distanceInfo`, `distanceTextFromSitecore`, `containsLuxuryPromoCode`, `getTouristTaxFieldsFromOffer`, and `getFormattedPrice` are imported to handle specific data transformations and formatting.
- **Store Hooks and Models:** `useStore` custom hook, `MarketStore`, `BaseLayoutStore`, `LayoutStore`, `BookingStore`, and `RouterStore` are used for accessing and manipulating application state.
- **Components:** Various React components like `TouristTaxPriceLabel`, `TouristTaxPriceTooltip`, and icons (`SvgHotelBedFilled`, `SvgLocationPinFilled`) are imported for building the UI.
- **Styles:** CSS module styles from `./MapCard.module.scss` are imported to apply specific styles to the map card components.
- **Data Models:** Interfaces like `IHotel`, `IOffer`, `IStop`, `IGeoPoint`, `IImage`, and `IOfferWithHotelData` define the types used throughout the component to ensure type safety and clarity.

### Structure

The file defines multiple JavaScript functions and TypeScript interfaces that collectively contribute to the functionality of a map card component in a travel or hotel booking application:

- **Interfaces (`IGetOptionsArgs`, `IMapConfigOptions`, `IUseMapCardProps`, `IUseMapCardData`):** These TypeScript interfaces define the shapes of various objects and function parameters used within the component, enhancing code reliability and type-checking.
- **Constants (`DEPOSIT_KEY`, `PRICE_KEY`, `PRICE_PP_KEY`, `TOURIST_TAX_KEY`):** Defined to maintain readability and reusability of key indices.
- **Utility Functions (`onWheel`, `addPriceToOptions`, `getOptions`):** These functions handle specific interactions like preventing event bubbling, constructing option lists for UI rendering, and formatting data for display.
- **Main Hook (`useMapCard`):** This custom React hook encapsulates the main logic for fetching, preparing, and managing the state related to the map card display based on either hotel or stop data.
- **Data Fetching and Effect Management:** Within `useMapCard`, `useEffect` is used to fetch data based on the provided hotel or stop properties and manage loading states.
- **Memoization:** `useMemo` is utilized to optimize performance by memoizing computed data that only changes when specific dependencies update.

### Logic

The core functionality revolves around displaying detailed information on a map card, which can be related to a hotel or a geographical stop:

- **Data Handling and State Management:** The hook `useMapCard` manages the fetching of hotel or offer data, handling loading states, and caching results to optimize performance and user experience.
- **Dynamic Content Rendering:** Based on the fetched data, various options and details (like prices, tourist tax, room types, etc.) are dynamically constructed and formatted for display.
- **Event Handling:** The `onWheel` function and the `onClick` handler in `getButtonData` function manage user interactions, preventing default behaviors where necessary and handling button clicks.
- **Conditional Rendering and Fallbacks:** The component logic includes conditions to handle missing data gracefully, providing fallbacks (e.g., fallback images) and checking whether specific features (like luxury promo codes) are applicable.
- **Integration with External State:** The hook integrates with global state management (via `useStore`) to access and manipulate global states like selected offers, settings, and phrases, which are crucial for rendering localized and context-specific information on the map card.