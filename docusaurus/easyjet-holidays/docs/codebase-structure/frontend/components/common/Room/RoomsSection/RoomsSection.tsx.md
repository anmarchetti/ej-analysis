### Imports

The `RoomsSection` component uses several imports from both internal and external sources:

- **React and Libraries:**
  - `FC` from `react`: Importing React's Function Component type for TypeScript typing.
  - `classNames` from `classnames`: A utility to conditionally join classNames together.

- **Models and Interfaces:**
  - `IUnit` from `models/data/IOffer`: Interface representing a unit (room).
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enum for Sitecore dictionary items.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent`: Interface for generic Sitecore component properties.

- **Components:**
  - `RoomCard` from `frontend/components/common/Room/RoomCard/RoomCard`: A component that displays individual room details.
  - `RoomCardsList` and its interface `IRoomCardListMobileMeta` from `frontend/components/common/Room/RoomCardsList/RoomCardsList`: A component that lists multiple `RoomCard` components and handles mobile-specific metadata.

- **Styles:**
  - `styles` from `./RoomsSection.module.scss`: Module CSS for styling the `RoomsSection` component.

### Structure

The `RoomsSection` component is structured to receive multiple props defined by the `IRoomsSectionProps` interface, which includes:

- **Room Information:**
  - `rooms`: Array of `IUnit` objects representing available rooms.
  - `chosenRoom`: Optionally highlighted room as selected by the user.
  
- **UI Control Texts:**
  - `hideMoreCollapsedTitle`: Text for collapsing additional rooms.
  - `showMoreExpandedTitle`: Text for expanding to show more rooms.
  - `originalRoomTitle`: Title displayed for the chosen room.
  - `altRoomsTitle`: Alternative title for the rooms list.

- **Behavioral and Styling Props:**
  - `onChangeRoom`: Callback function triggered when a room selection changes.
  - `isLoading`: Boolean to show loading state.
  - `loadingSkeleton`: JSX.Element to display as a placeholder during loading.
  - `pricePostfix`: Enum item from `SitecoreDictionary` to append to room prices.
  - `containerClass`: Optional className for additional styling.
  - `countryCode`: Country code for regional configurations.
  - `freeChildPlaceTooltip`: Tooltip text for promotions like free places for children.
  - `mobileListMeta`: Metadata for mobile view configurations.
  - `showRoomsPart`: Number to control how many rooms to show initially.
  - `rendering`: Sitecore rendering data.

The JSX structure conditionally renders two main blocks based on the presence of `chosenRoom` and the `rooms` array length. It uses the `classNames` utility to merge `styles.container` with any `containerClass` passed as props.

### Logic

The component's logic revolves around conditional rendering and the propagation of props to child components:

- **Conditional Rendering:**
  - If `chosenRoom` is provided, it renders a `RoomCard` for the selected room with specific labels and tooltips.
  - The list of rooms (`rooms`) is displayed using the `RoomCardsList` component only if the array has elements.

- **Propagating Props:**
  - Props such as `pricePostfix`, `isLoading`, `freeChildPlaceTooltip`, `countryCode`, and `loadingSkeleton` are passed to both `RoomCard` and `RoomCardsList` to ensure consistent behavior and styling across the component.
  - The `onChangeRoom` function is passed down to `RoomCardsList` to handle room selection changes.

- **Accessibility and Testing:**
  - Aria-labels and data attributes (`data-tid`) are used for accessibility and to facilitate testing.

This structure and logic enable the `RoomsSection` to serve as a flexible and reusable component within a larger application, specifically tailored for displaying room options and handling user interactions efficiently.