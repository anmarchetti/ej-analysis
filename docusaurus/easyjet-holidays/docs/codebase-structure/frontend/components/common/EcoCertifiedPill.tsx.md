### Imports
The `EcoCertifiedPill` component uses several imports to function properly:

- **React Imports**:
  - `FunctionComponent` and `useRef` from `react` for defining the functional component and referencing DOM elements.

- **Utility Imports**:
  - `classNames` from `classnames` for dynamically setting class names based on conditions.

- **Custom Hook Imports**:
  - `useStore` from `frontend/hooks/useStore` to access and utilize state management stores.

- **Type Imports**:
  - `TStores` from `frontend/store/IStores` representing the type definition for stores.
  - Enums from `models/enum/Callout` and `models/enum/tracking/EventTypes` for predefined constants used within the component.

- **Component Imports**:
  - `SvgEcoCertified` from `frontend/components/icons-new/EcoCertified` for the icon displayed in the pill.
  - `Callout` and `Pill` components for displaying UI elements.

- **Styles Import**:
  - `styles` from `./EcoCertifiedPill.module.scss` for specific styling of the component.

### Structure
The `EcoCertifiedPill` component is structured as follows:

- **Component Definition**:
  - Defined as a functional component `EcoCertifiedPill` using `FunctionComponent` type with props `IEcoCertifiedPillProps`.

- **Props Interface** (`IEcoCertifiedPillProps`):
  - `title`: Required string that represents the title of the pill.
  - `className`: Optional string for additional CSS class names.
  - `isNewPill`: Optional boolean to determine if the new pill variant should be used.
  - `tooltip`: Optional string for additional information displayed on hover.

- **Hooks Usage**:
  - `useStore` custom hook is utilized to fetch necessary functions and states from the global store.
  - `useRef` for referencing the tooltip container for potential manipulations.

### Logic
The component contains several logical segments:

- **Store Data Extraction**:
  - Extracts `trackEcoCertified` function and `isDisabled` boolean from the store using `useStore`.

- **Event Handlers**:
  - `handleOnClick` and `handleOnMouseEnter` for tracking interactions (clicks and hovers) with the component.

- **Conditional Rendering**:
  - Checks if the feature is disabled (`isDisabled`). If true, the component renders `null`.
  - Uses the `isNewPill` prop to determine which variant of the pill to render. If `isNewPill` is true, it renders the `Pill` component; otherwise, it renders a `div` with the old layout.

- **Dynamic Class Names**:
  - Uses `classNames` to dynamically assign classes based on the props and styles.

- **Tooltip Handling**:
  - Conditionally renders a `Callout` component if `tooltip` is provided. The `Callout` component displays the tooltip content and is positioned based on predefined enums.

This component effectively demonstrates conditional rendering, dynamic class assignment, and event handling based on the props and the application's state.