## Imports

The `HoldLuggageBanners` component imports several modules and components to function properly:

- `React, { FC }`: Imports React and its Function Component type (FC) for defining the component type.
- `observer`: Imported from `mobx-react-lite` to make the component reactive to MobX state changes.
- `useStore`: A custom hook from `frontend/hooks/useStore` used for accessing the MobX store.
- `TStores`: A TypeScript type from `frontend/store/IStores` that defines the structure of the stores used in the application.
- `ISitecoreField`: A TypeScript interface from `models/sitecore/generic/ISitecoreField` that describes the structure of a field managed by Sitecore.
- `InfoBlock`: A reusable React component from `frontend/components/common/InfoBlock/InfoBlock` used for displaying information blocks within the UI.
- `styles`: Specific SCSS module for styling, imported from `./HoldLuggageBanners.module.scss`.

## Structure

The `HoldLuggageBanners` component is defined as a functional component using TypeScript. It utilizes the `FC` type for props validation, and the props are defined by the `IHoldLuggageBannersProps` interface. This interface includes several fields of type `ISitecoreField<string>`, which are used to manage content provided by Sitecore:

- `internalFlightDescription`
- `internalFlightHeader`
- `requestFailureDescription`
- `requestFailureHeader`
- `unavailableMessageDescription`
- `unavailableMessageHeader`

These props are destructured in the component's function parameters for easy access.

## Logic

The component's logic revolves around conditional rendering based on the state of the application, which is derived from various MobX stores:

1. **MobX Store Hooks**: The `useStore` hook is used to extract specific state values from the MobX stores:
   - `isFlightExtrasFailed`: Indicates if there was a failure in fetching flight extras.
   - `extraLuggageCategoriesExist`: Checks if there are any extra luggage categories available.
   - `isFlightExternal`: Determines if the current flight is external.
   - `isExtraLuggageEnabled`: A boolean that indicates if extra luggage feature is enabled.

2. **Conditional Rendering**:
   - If `isExtraLuggageEnabled` is `false`, it renders an `InfoBlock` with `unavailableMessageDescription` and `unavailableMessageHeader`.
   - If the flight is not external (`!isFlightExternal`), it renders an `InfoBlock` with `internalFlightDescription` and `internalFlightHeader`.
   - If `isFlightExtrasFailed` is `true` or `extraLuggageCategoriesExist` is `false`, it renders an `InfoBlock` with `requestFailureDescription` and `requestFailureHeader`, including a warning icon.

3. **Return Null**: If none of the conditions are met, the component returns `null`, meaning no UI is rendered.

Each conditional block uses the `InfoBlock` component for displaying the respective messages and titles, applying a specific class for styling (`styles.failureBanner`) and a unique `dataTid` for testing purposes.