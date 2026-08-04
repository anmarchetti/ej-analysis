### Imports

The code begins by importing various modules and types from external and internal sources:

- **React Imports**: 
  - `FunctionComponent` and `MouseEvent` from `react` are standard imports for typing components and event handling respectively.
  
- **MobX Imports**: 
  - `observer` from `mobx-react` is used to make the React component reactive to observable changes in the MobX store.

- **Custom Hook and Store Types**:
  - `useStore` from `frontend/hooks/useStore` is a custom hook for accessing MobX stores.
  - `TStores` from `frontend/store/IStores` defines the type for the available stores in the application.

- **Models and Enums**:
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary` likely contains constants or identifiers for dictionary keys.
  - Interfaces (`ISitecoreComponent`, `IBundleSiteCoreFields`, `IPromoCode`, `IBundle`, `IBundleElement`, `IBundleIcon`) are imported from various paths under `models/` to type the data structures used in the component.

- **Component Imports**:
  - `Button` and `StartBookingButton` from `frontend/components/common/` are reusable UI components.

### Structure

The file defines a React functional component named `Bundles` using TypeScript. Here's a breakdown of the structure:

- **Interfaces**:
  - `IBundleSiteCoreFields`, `IPromoCode`, `IBundle`, `IBundleElement`, `IBundleIcon` are TypeScript interfaces used to type the props and internal data structures of the component.

- **Component Definition**:
  - `Bundles` is a `FunctionComponent` typed with `ISitecoreComponent<IBundleSiteCoreFields>`. This component takes `fields` as a prop, which contains an array of `items` (promo codes).

- **MobX Store Usage**:
  - Inside the component, the `useStore` hook is used to extract `getPhrase` and `packageInfo` from the MobX stores.

### Logic

- **Data Filtering**:
  - The component filters `fields.items` based on `packageInfo.Prom`, a property from the MobX store. It looks for an item where the `promoCode` matches `packageInfo.Prom` and assigns it to the `bundles` variable.

- **Rendering**:
  - The component returns a JSX fragment containing:
    - A `StartBookingButton` component, which uses a render prop pattern. This button, when clicked, triggers an event passed via the `onClick` prop.
    - The `Button` inside `StartBookingButton` is configured with several props (`id`, `isLarge`, `isFullWidth`, `onClick`, `className`) and displays a text retrieved via `getPhrase` using `SitecoreDictionary.GlobalsButtonsContinue`.
    - It conditionally displays the `promoCode` of the selected `bundles` if available.

- **Reactivity**:
  - The `Bundles` component is wrapped with `observer` from MobX, making it reactive to changes in the MobX store states used within the component (`packageInfo` in this case).

This structure and logic allow the component to dynamically display and update based on the state managed in MobX stores, particularly focusing on promotional codes and package information.