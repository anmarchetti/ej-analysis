## Imports

The `AltBoardPopupContent` component imports several modules and dependencies which are categorized as follows:

- **React and Hooks**: The `FC` (Functional Component) and `useMemo` are imported from `react` for creating functional components and memoizing values respectively.
- **Sitecore JSS**: `Text` is imported from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore items.
- **MobX**: `observer` is imported from `mobx-react` for making the component reactive to MobX state changes.
- **Custom Hooks and Utilities**:
  - `useStore` is a custom hook from `frontend/hooks/useStore` to access MobX stores.
  - Utility functions `checkRoomsOnFreeForKids`, `getNewOfferUnitsByBoard`, and `sortBoardsByPrice` are imported from `frontend/utils` for specific data manipulations related to offers and boards.
- **Type Definitions**: Interfaces like `IBoardType`, `IAltBoard`, `IOffer`, `TAllBoards`, and `IAltBoardsPopupFields` are imported from `models/data` to type the data structures used within the component.
- **Enums**: `EventActions` from `models/enum/tracking/GenericEventParams` is used for tracking event actions.
- **Components**:
  - `InfoBlock`, `AltBoardsPopupSkeleton`, `AltBoardsSection`, and `OtherBoardsSplit` are imported from `frontend/components` for rendering various parts of the popup.
- **Styles**: CSS module styles from `frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss` are imported to style the component.

## Structure

The `AltBoardPopupContent` component is structured as follows:

- **Props Definition**: `IAltBoardPopupContentProps` interface defines the props the component accepts, which include `allBoards`, `confirmedBoard`, `fields`, and an optional `offer`.
- **Functional Component Definition**: `AltBoardPopupContent` is defined as a functional component using React's `FC` type, accepting `IAltBoardPopupContentProps`.
- **State and Store Hook**: Uses the `useStore` custom hook to derive state from various MobX stores.
- **Memoization**: `useMemo` is used to compute whether the selected board offers free accommodation for kids, based on the `offer` prop.
- **Conditional Rendering**: The component conditionally renders a skeleton loader if data is still loading.
- **Event Handlers**: Defines an `onSelect` function to handle the selection of an alternative board, updating the offer and tracking the selection event.
- **Return JSX**: The component returns a structure composed of headers, sections, and conditional blocks to display confirmed and alternative board options, along with an informational block.

## Logic

The component's logic primarily revolves around handling alternative board selections for hotel offers:

- **Loading State**: Initially checks if the offers are still loading and displays a skeleton loader if true.
- **Sorting and Filtering**: Alternative boards are sorted by price and filtered based on the board codes.
- **Selection Handling**:
  - Upon selecting an alternative board, the component calculates new offer units based on the selected board and the first alternative room available.
  - Updates the offers with the selected board using `updateOffersWithSelectedBoard` from the MobX store.
  - Resets the active offer ID and tracks the selection event using `trackSelectAltBoard`.
- **Conditional Content Rendering**:
  - If there are alternative boards available and the selected board offers free accommodation for kids, it renders split sections for boards with and without free child places.
  - Otherwise, it renders a single section listing all alternative boards.
- **Information Display**: An `InfoBlock` component is used to display additional information about room changes based on the `fields` prop.