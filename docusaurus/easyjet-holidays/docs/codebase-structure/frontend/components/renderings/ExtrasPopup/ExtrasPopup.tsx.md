## Imports

The `ExtrasPopup` component uses a variety of imports from both external libraries and internal modules:

- **React and Hooks**: Imports standard React functionalities including `FC` (Functional Component), `useEffect`, `useMemo`, and `useState` from the `react` package.
- **Sitecore JSS**: Uses `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore items.
- **Classnames**: A utility function `classnames` is imported for conditional classname handling.
- **MobX**: Imports `observer` from `mobx-react` for making the component reactive to state changes in MobX stores.
- **Custom Hooks**: Imports `useMoreThenMobileViewport` and `useStore` from the internal hooks directory to manage responsive behaviors and access MobX stores respectively.
- **Models and Types**: Several types related to Sitecore and tracking events are imported from the `models` directory.
- **Components**: Imports various UI components like `Button`, `ExpandableItem`, `FloatingPopup`, `JSSImage`, and `PopupCloseButton` from a common components directory.
- **Styles**: Imports SCSS module for styling from `./ExtrasPopup.module.scss`.
- **Child Components**: Imports `ExtraItemContent` which is a child component used within this module.

## Structure

The `ExtrasPopup` component is structured as follows:

- **Type Definitions**: Defines custom types `TExtraHighlight` and `TExtraItemFields` for handling the props structure of the items and highlights within the extras.
- **Component Definition**: `ExtrasPopup` is a functional component using React's Functional Component type annotated with Sitecore specific props.
- **State Management**: Uses `useState` to manage the state of the popup visibility and the currently expanded tile.
- **Memoization**: Utilizes `useMemo` to compute sorted tiles based on conditions like filtering out tiles based on the booking state and sorting them based on popularity.
- **Effects**: An `useEffect` hook is used to set the initial expanded tile and track the popup impression when the component mounts or updates based on dependencies.
- **Conditional Rendering**: The component returns `null` if certain conditions aren't met, such as no fields being available or no sorted tiles to display.
- **Event Handlers**: Defines functions `onClose` and `onTileClick` to handle closing the popup and managing tile expansion, respectively, including tracking these interactions.

## Logic

The component's logic can be summarized in the following key functionalities:

- **Initial State Setup**: On component mount, the first tile is expanded, and an impression tracking event is fired.
- **Responsive Behavior**: Uses the `useMoreThenMobileViewport` hook to adjust UI components based on the viewport size.
- **Sorting and Filtering**: Tiles are filtered to exclude certain items based on the booking state (e.g., airport parking) and are sorted by their popularity.
- **Event Tracking**: The component tracks different user interactions like closing the popup and expanding tiles using the `trackEventWithParams` function from the store.
- **Dynamic Class Handling**: Uses the `classnames` utility to dynamically handle class names based on the state, such as applying active styles when a tile is expanded.
- **Popup Management**: Manages the visibility of the popup and its content through state and provides UI controls for closing the popup.
- **Children Rendering**: Maps over `sortedTiles` to render `ExpandableItem` components for each tile, passing necessary props and handling expansion logic.

Overall, the `ExtrasPopup` component demonstrates complex state management intertwined with responsive design adjustments, MobX state interactions, and dynamic rendering based on fetched Sitecore data.