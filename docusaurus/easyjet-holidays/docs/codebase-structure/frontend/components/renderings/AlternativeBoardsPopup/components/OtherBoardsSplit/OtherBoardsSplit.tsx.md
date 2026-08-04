## Imports

The code starts by importing various modules and components necessary for the functionality of the `OtherBoardsSplit` component:

- Utility functions from `frontend/utils/offer.utils`:
  - `checkRoomsOnFreeForKids`: Checks if rooms are free for kids.
  - `getNewOfferUnitsByBoard`: Retrieves new offer units by board type.
- TypeScript interfaces from `models/data/IHotel` and `models/data/IOffer`:
  - `IBoardType`: Interface representing a board type.
  - `IAltBoard`, `IOfferWithoutAltBoards`, `IUnit`: Interfaces representing alternative boards, offers without alternative boards, and units, respectively.
- SCSS module for styling from `frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss`.
- `AltBoardsSection` component from `frontend/components/renderings/AlternativeBoardsPopup/components/AltBoardsSection/AltBoardsSection`, used to render sections of alternative boards.

## Structure

The `OtherBoardsSplit` functional component is structured to accept props defined by the `IOtherBoardsSplitProps` interface:

- `altBoards`: Array of alternative board types.
- `altRooms`: Array of arrays of unit types.
- `confirmedBoard`: The board type that has been confirmed.
- `onSelect`: Function to handle the selection of a board.
- `selectedOffer`: The currently selected offer, which may or may not have alternative boards.
- `withFreeChildLabel`: Label for sections where children stay for free.
- `withoutFreeChildLabel`: Label for sections where children do not stay for free.

The component returns a JSX element structure that conditionally renders based on the presence of a `selectedOffer`. If `selectedOffer` is not present, it returns `null`.

## Logic

The component's logic is primarily concerned with categorizing alternative boards into two groups based on whether the rooms are free for kids:

1. **Categorization of Boards**:
   - Iterate over each `altBoard` and use the `getNewOfferUnitsByBoard` utility function to get new units based on the selected offer's accommodation unit and the first set of alternative rooms.
   - Use the `checkRoomsOnFreeForKids` utility function to determine if these new units qualify for free stays for kids.
   - Based on the result, alternative boards are pushed into either `altBoardsWithFreeChild` or `altBoardsWithoutFreeChild`.

2. **Rendering**:
   - Two `<AltBoardsSection>` components are rendered within a parent `<div>`. Each section represents either boards with or without free child stays:
     - `items`: The array of boards to be displayed in the section.
     - `label`: The label to be used for the section, determined by whether or not children stay for free.
     - `confirmedBoard` and `selectedOffer`: Passed to handle state and selection appropriately.
     - `onSelect`: Function passed to handle user interaction when a board is selected.

This setup ensures that the `OtherBoardsSplit` component is capable of dynamically displaying alternative board options based on specific criteria related to child accommodation, enhancing the user experience by clearly categorizing these options.