## Imports

The `RoomCard` component utilizes several imports to function properly:

- **React Imports:**
  - `FunctionComponent` and `useRef` from `react` are used for defining the functional component and referencing DOM elements respectively.

- **Utility and Helper Imports:**
  - `classnames` is used for dynamically setting CSS class names based on the component's state or properties.

- **Custom Hooks and Store:**
  - `useStore` is a custom hook for accessing the Redux store state.
  - `TStores` is a type definition that helps in specifying the structure expected from the useStore hook.

- **Data Models:**
  - `IUnit` represents the data model for room information.
  - `SitecoreDictionary` and `SiteSettings` are enumerations for managing site-specific settings and text dictionaries.

- **Components:**
  - `OfferCardSlider` is a component for displaying a series of images as a slider.
  - `RoomSkeleton` is a placeholder component displayed while the data is loading.
  - `RoomCardContent` is a sub-component that displays detailed information about the room.

- **Styling:**
  - Styles specific to the `RoomCard` component are imported from `RoomCard.module.scss`.

## Structure

The `RoomCard` component is structured as follows:

- **Props:** Defined by the `IRoomCardProps` interface, which includes:
  - `room`: The room data.
  - `countryCode`, `fallbackImage`, `freeChildPlaceTooltip`: Optional props for customization based on locale or specific needs.
  - `isLoading`, `isSelected`: Boolean flags to control UI behavior.
  - `loadingSkeleton`: A JSX element to be used as a loading placeholder.
  - `onChange`: Callback function triggered on certain user interactions.
  - `pricePostfix`: A dictionary item for appending text to prices.

- **Component Definition:**
  - A functional component using React's `FunctionComponent` type, with destructured props for easier access.
  - A `ref` (`roomRef`) is created to reference the container div for potential manipulations like dynamic height adjustment.

- **Rendering Logic:**
  - If `isLoading` is true, the component renders either a custom `loadingSkeleton` or the default `RoomSkeleton`.
  - The `OfferCardSlider` is used for displaying room images, with a fallback image provided by a site setting.
  - `RoomCardContent` is rendered to show detailed room information and handles user interactions through `handleChange`.

## Logic

- **Loading Handling:**
  - When `isLoading` is true, the component opts to display a skeleton or a passed loading skeleton component. This is useful for improving user experience during data fetch operations.

- **Event Handling:**
  - `handleChange` is a function that executes the `onChange` callback with the current room data when an interaction occurs, facilitating state management or parent component interaction.

- **Dynamic Styling:**
  - The `classnames` utility is used to dynamically apply CSS classes based on the component's state, such as `isSelected` and `isLoading`.

- **Settings and Defaults:**
  - The `getSetting` function from the store is used to retrieve global settings like the default fallback image, ensuring the component has all necessary data to function independently within different parts of the application.

- **Accessibility and Data Attributes:**
  - A `data-tid` attribute (`room-card`) is used for easier targeting in tests or for specific styling hooks.