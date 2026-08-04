## Imports

The `BoardCard` component imports several modules and utilities, which can be categorized into React-related, utility functions, models, custom hooks, and styles:

1. **React and MobX**: 
   - `React` for basic React functionalities.
   - `FC, useEffect, useRef` from `react` for functional component typing, side effects, and referencing DOM elements.
   - `observer` from `mobx-react` for making the component reactive to observable changes.

2. **Utilities and Helpers**:
   - `classNames` for dynamically setting CSS class names.
   - `isBackend` to determine if the code is running on a backend server.
   - `getImageUrl` for resolving image URLs.

3. **Models**:
   - `IBoardType` and `IAltBoard` interfaces from the models directory to type the props.
   - `SitecoreDictionary` for accessing enumeration values used in the component.

4. **Custom Hooks and Contexts**:
   - `useStore` to access MobX stores.
   - `useRoomAndBoardLocalStore` to manage local state specific to room and board operations.

5. **Components**:
   - Various UI components like `BoardCardSkeleton`, `DiscountedBoardPercentagePill`, `FreeBoardUpgradePill`, and `FreeForKidsPill` for displaying specific UI elements based on the state.

6. **Styles**:
   - `styles` from `BoardCard.module.scss` for component-specific styling.

## Structure

The `BoardCard` component is structured as follows:

1. **Props Definition (`IBoardCardProps`)**:
   - Defines the shape of props the component expects, including optional and mandatory fields.

2. **Functional Component Definition**:
   - The component uses destructuring to extract props.
   - Utilizes `useRef` to keep a reference to the card DOM element.
   - Uses custom hooks to fetch state and actions from MobX stores and local store context.

3. **Conditional Renderings**:
   - The component conditionally renders different skeletons based on the loading state and screen size.
   - It conditionally renders different UI pills based on the board's properties and component's state.

4. **Event Handlers**:
   - Defines `updateBoard` and `deleteBoard` functions inside `useEffect` to handle user interactions, which are conditionally attached based on the edit mode.

5. **Dynamic Class Names**:
   - Uses `classNames` to dynamically apply CSS classes based on the component's state and props.

6. **Return Statement**:
   - The JSX structure includes various checks and conditions to render different parts of the component based on the state and props. It also handles dynamic HTML content safely using `dangerouslySetInnerHTML`.

## Logic

The component's logic is primarily focused on responding to state changes and user interactions:

1. **Loading State**:
   - Checks if the component is in a loading state from either global or local stores and renders appropriate skeletons.

2. **Edit Mode Interactions**:
   - In edit mode, event listeners are attached to buttons for updating and deleting boards. These listeners are cleaned up when the component or mode changes.

3. **Dynamic Content and Styling**:
   - Based on the selected state and properties of the board, different parts of the card (like icons, titles, and descriptions) are dynamically styled or altered.

4. **Conditional UI Enhancements**:
   - Displays UI enhancements like pills based on the board's properties (e.g., discounts, free upgrades) and the component's state (e.g., post-booking).

5. **Use of MobX Stores**:
   - The component interacts with multiple stores to get phrases, check screen sizes, and manage edit modes, which help in making the component reactive and integrated within the larger application ecosystem.

This technical documentation outlines the key aspects of the `BoardCard` component, focusing on its dependencies, structure, and the logical flow that drives its behavior in a React and Sitecore-powered application.