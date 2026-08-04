## Imports

The `FeaturedHotelCard` component imports several modules and components to facilitate its functionality:

- **React Hooks and Functionalities**: Utilizes `React`, `useEffect`, `useMemo`, and `useState` for managing component state and lifecycle.
- **MobX**: Uses `observer` from `mobx-react` for state management in a React component.
- **Utility Functions and Constants**:
  - `DATE_FORMATS` from `code/dates` for managing date formats.
  - `formatDateL10n` from `frontend/utils/date.utils` to localize date formats.
  - `containsLuxuryPromoCode` from `frontend/utils/offer.utils` to check for specific promotional codes.
  - `purifyUrl` from `frontend/utils/url.utils` for URL sanitization.
- **Custom Hooks**:
  - `useStore` for accessing MobX stores.
- **Type Definitions**:
  - `TStores` from `frontend/store/IStores` which likely contains the type definition for the MobX stores.
  - `IFeaturedHotelsWithPrice` from `models/data/IFeaturedHotel` for the type definition of the hotel object.
  - `MediaSize` from `models/data/MediaSizeParams` for responsive image handling.
- **Components**:
  - `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext` for optimized image rendering.
  - `Link` and `LuxuryBadge` from `frontend/components/common` for navigation and displaying luxury badges respectively.
  - `FeaturedHotelCardInfo` which is a sibling component that displays detailed information about the hotel.
- **Styling**:
  - `styles` from `./FeaturedHotelCard.module.scss` for component-specific styles.

## Structure

The `FeaturedHotelCard` is a functional component that accepts `IFeaturedHotelCardProps` as props, which include:

- `fallbackImage`: A string URL used as a fallback if the main hotel image fails to load.
- `hotel`: An object containing details about the hotel.
- `onClick`: A function to handle click events on the card.
- `displayNumberOfNights`: An optional boolean to decide if the number of nights should be displayed.

The component is wrapped with the `observer` function from MobX, making it reactive to changes in the observable state used within.

## Logic

### State and Effects:

- **infoBlockHeight**: A state variable to maintain the uniform height of hotel info blocks across different cards.
- An `useEffect` hook is used to calculate and set the maximum height of hotel info blocks upon component mount and during window resize or orientation change events.

### Computed Properties:

- **hasLivePrice**: Determines if live pricing is enabled and valid for the hotel.
- **hotelLinkQuery** and **hotelLink**: These `useMemo` hooks compute the query string for live price searches and the final URL for the hotel link based on whether live pricing is available.

### Event Handlers:

- **onHotelLinkClick**: Handles click events on the hotel link, setting search values if live pricing is active and invoking the `onClick` prop function.

### Rendering:

- The component conditionally renders various elements such as the `LuxuryBadge`, `JSSImageNext` for the hotel image, and a date badge.
- The `FeaturedHotelCardInfo` component is rendered with props passed down to display detailed hotel information.
- Uses conditional rendering based on the `hotel` prop to return `null` if no hotel data is available, ensuring robust error handling.

### Styling:

- Utilizes CSS modules for scoped styling, with conditional application of styles based on the state like `isLuxury` to show luxury badges.

This component effectively demonstrates complex interactions between state management, conditional rendering, and responsive design practices in a React application.