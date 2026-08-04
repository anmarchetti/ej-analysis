## Imports

The code imports various constants, utility functions, and types from different modules which are organized as follows:

- **Constants**: 
  - `TWO` from `code/commonNumbers` which is likely used for comparison or conditional checks.

- **Utility Functions**:
  - `getRoomName` from `frontend/utils/offer.utils` used to fetch a formatted room name based on the room type.

- **Type Definitions**:
  - `IBoardType` from `models/data/IHotel` representing a board type in a hotel.
  - `IAltBoard`, `IOfferWithoutAltBoards`, `IUnit`, `TAllBoards` from `models/data/IOffer` representing different data structures related to offers and rooms in the context of a hotel booking system.
  - `IAlterationResultItem` from `frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer` used to define the structure of items in the booking alteration drawer.

## Structure

The code defines two main exported functions:

1. **`getNewAlternativeRooms`**:
   - **Parameters**: Takes in a board type (`changedBoard`), an array of selected rooms (`selectedRooms`), all available alternative rooms (`allAlternativeRooms`), and an optional fallback image URL (`fallbackImage`).
   - **Return Type**: Returns an array of `IAlterationResultItem<IUnit>`, which includes details about the new and old room items along with other metadata.

2. **`getBoardTypesToShow`**:
   - **Parameters**: An object containing various flags and data structures related to the board display logic, including mode flags (`isEditMode`, `isCollapsed`, `isExtrasPage`, `drawerMode`), data about board types (`allBoardTypes`, `alternativeBoards`), and the offer data (`offer`).
   - **Return Type**: Returns a subset of `TAllBoards` depending on the provided parameters and conditions.

## Logic

### `getNewAlternativeRooms`

This function processes a list of selected rooms and determines if each room needs an alteration based on a `changedBoard`. If an alteration is needed (indicated by the presence of an `alterationCode`), it attempts to find a matching room from `allAlternativeRooms`. If a match is found, it constructs a result item including details about the new and old room, and checks if a specific condition related to children's pricing (`isKidsPlaceWilBeRemoved`) has changed.

### `getBoardTypesToShow`

This function determines which board types should be displayed based on various conditions:
- **Edit Mode and Offer Check**: If in edit mode or if no offer is present, all board types are returned.
- **Number of Boards**: If there are fewer than two board types, all are returned.
- **Drawer Mode**: If in drawer mode, only alternative boards are returned.
- **Collapsed State**: Depending on whether the view is collapsed or expanded and if it's the extras page, a subset of boards is returned. In the collapsed state on the extras page, only the selected board is shown. Otherwise, a mix of selected and alternative boards up to a predefined number (`DEFAULT_COLLAPSED_BOARDS_NUMBER`) is shown.
- **Expanded State**: In an expanded state, the selected board and all alternative boards are shown, potentially sorted by price.

This function uses logical conditions to adapt the board display dynamically based on user interaction and the current state of the application.