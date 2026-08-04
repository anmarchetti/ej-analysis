### Imports

The `RoomCardContent` component imports various modules and components to function properly:

- **React Functionality**: Imports `FC` (FunctionComponent) from `react` for defining the functional component type.
- **Model and Enums**: 
  - `IUnit` from `models/data/IOffer` is an interface for room unit data.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` is likely an enumeration used for localized strings or constants specific to Sitecore implementations.
- **Components**:
  - `RoomCardAction` from `frontend/components/common/Room/RoomCard/components/RoomCardAction/RoomCardAction` for the action elements like booking or selecting a room.
  - `RoomCardTitle` from `frontend/components/common/Room/RoomCard/components/RoomCardTitle/RoomCardTitle` to display the room title and possibly some additional information.
  - `RoomFacilities` from `frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities` to list the facilities of the room.
- **Styling**: 
  - `styles` from `./RoomCardContent.module.scss` for CSS modules specific to this component.

### Structure

The `RoomCardContent` component is structured as follows:

- **Props**: Defined by the `IRoomCardContentProps` interface, which includes:
  - `room`: The room data.
  - `countryCode`: Optional country code for localization.
  - `freeChildPlaceTooltip`: Optional tooltip text.
  - `isSelected`: Boolean to indicate if the room is selected.
  - `onClick`: Optional click handler.
  - `pricePostfix`: Optional postfix for the room price, linked to the `SitecoreDictionary`.
- **JSX Structure**:
  - A top-level `div` with a class `container` from the imported styles.
  - `RoomCardTitle` component displays the room title and handles the tooltip and subtitle based on selection.
  - A nested `div` for the main content containing:
    - `RoomFacilities` to list the room's facilities.
    - `RoomCardAction` for action elements like pricing and buttons, styled specifically and handling clicks.

### Logic

The component logic primarily revolves around the presentation of the room data and interaction handling:

- **Conditional Rendering**: 
  - The `RoomCardTitle` includes a subtitle only if the `isSelected` prop is true.
- **Passing Props**:
  - `RoomFacilities` receives `facilities` and `roomFacilityFolderId` directly from `roomType`, which is a property of the `room` object.
  - `RoomCardAction` receives the `price`, visibility flag, selection status, and the `onClick` handler. It also receives a `pricePostfix` if provided.
- **Styling**:
  - Conditional and static class names from `styles` are applied to elements to control their appearance based on the component state (e.g., `isSelected`).

This component effectively encapsulates the room data presentation logic, providing a clear and interactive way for users to view room details and perform actions like selecting or booking a room.