## Imports

The `ExportButtons` component imports various modules and functionalities which are categorized as follows:

- **React and MobX**: 
  - `FC` from `react` - Functional Component type from React for type-checking.
  - `observer` from `mobx-react` - To make the React component reactive to MobX state changes.

- **Utilities and Hooks**:
  - `classNames` - A utility function for conditionally joining classNames together.
  - `useAgentLogo` and `useStore` - Custom hooks from `frontend/hooks` for fetching the agent logo and accessing the MobX store respectively.

- **Type Definitions and Interfaces**:
  - `ISitecoreChildren`, `ISitecoreComponent`, `ISitecoreField`, and `ISitecoreImage` - Interfaces imported from `models` directory defining the types used for Sitecore related data handling.

- **Components**:
  - `Poster` and `PosterContent` - Components from `frontend/components/common` and a sub-component within the current directory used to structure the main UI elements of the ExportButtons component.

- **Styles**:
  - `styles` from `./ExportButtons.module.scss` - Module CSS for styling the component.

## Structure

The `ExportButtons` component is structured into interfaces and the main functional component:

- **Interfaces**:
  - `IExportButtonsFields` - Extends `IPosterFields` from the `Poster` component and includes additional fields specific to the `ExportButtons` component such as descriptions, labels, icons, and toggles for display options.
  - `IExportButtonsProps` - Contains a single property `items`, which is an array of `ISitecoreChildren` of `IExportButtonsFields`.
  - `TExportButtonsParams` - Type alias for `ISitecoreComponent` parameterized by `IExportButtonsProps`.

- **Functional Component**:
  - `ExportButtons` is a functional component typed with `TExportButtonsParams`. It utilizes the `useAgentLogo` hook to fetch the logo and the `useStore` hook to determine if the package is a luxury package. The component conditionally renders based on the presence of items and maps over these items to render `PosterContent` components.

## Logic

1. **Data Fetching**:
   - `UMLogoImage` is obtained using the `useAgentLogo` hook.
   - `isLuxuryPackage` is derived from the MobX store using the `useStore` hook, specifically from the `bookingStore`.

2. **Conditional Rendering**:
   - The component immediately returns `null` if there are no `items` in the `fields` prop, effectively preventing any further rendering or logic execution.

3. **Dynamic Class Handling**:
   - The `classNames` function is used to dynamically add the `luxury` class based on the `isLuxuryPackage` state, which affects the styling of the component.

4. **List Rendering**:
   - The component iterates over the `items` array (if present) and renders a `PosterContent` component for each item. Each `PosterContent` receives props such as `key`, `rendering`, `index`, `UMLogoImage`, and spreads the rest of the item properties.

5. **MobX Integration**:
   - The component is wrapped with `observer` from `mobx-react`, making it reactive to changes in the MobX state used within the component (e.g., changes in the luxury package status).

By structuring the component in this way, it maintains a clear separation of concerns between fetching data, handling state, and rendering UI, making the component both efficient and easy to maintain.