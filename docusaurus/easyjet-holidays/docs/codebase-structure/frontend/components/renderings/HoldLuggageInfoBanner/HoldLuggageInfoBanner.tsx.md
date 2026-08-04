## Imports

The `HoldLuggageInfoBanner` component utilizes several imports:

- **React and FC**: Imports the React library and the `FC` (Functional Component) type from React for typing the component.
- **classnames**: A utility function to conditionally join classNames together.
- **observer**: From `mobx-react`, it is used to make the component reactive to MobX state changes.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing MobX stores.
- **TStores, ISitecoreChildren, ISitecoreComponent, ISitecoreField, ISitecoreImage, ISitecoreLink**: Types and interfaces imported from various paths to ensure proper typing across the component.
- **InfoBlock**: A custom React component imported from `frontend/components/common/InfoBlock/InfoBlock`.
- **styles**: Module CSS for the component, imported from `./HoldLuggageInfoBanner.module.scss`.

## Structure

The `HoldLuggageInfoBanner` component is structured into the following main parts:

### Interfaces

- **IHoldLuggageInfoBannerItemFields**: Defines the shape of each item's fields containing `Description`, `Icon`, `Key`, `Link`, and `Title`.
- **IHoldLuggageInfoBannerFields**: Defines the shape of the component's expected fields, specifically an array of `items` which are `ISitecoreChildren` of `IHoldLuggageInfoBannerItemFields`.
- **THoldLuggageInfoBannerProps**: A type alias for the props of the component, which extends `ISitecoreComponent` with `IHoldLuggageInfoBannerFields`.

### Component Function

- **HoldLuggageInfoBanner**: A functional component typed with `FC<THoldLuggageInfoBannerProps>`, utilizing destructured `fields` from its props.

## Logic

1. **Store Hooks**: The component uses the `useStore` hook to derive `isConfirmationPage` and `isLuxuryPackage` from MobX stores, specifically `layoutStore` and `bookingStore`.

2. **Conditional Rendering**: 
   - Initially checks if `fields.items` exists and has length; if not, it returns `null`.
   - It then attempts to find an item in `fields.items` where the `Key` matches `'luxury'` if `isLuxuryPackage` is true, or an empty string if false.

3. **Content Extraction**:
   - If a matching item is found, it destructures `Title`, `Description`, `Icon`, and `Link` from the item's `fields`.
   - If no valid content fields are found after this step, it returns `null`.

4. **Rendering**:
   - Renders a `div` with a class from `styles.holdLuggageInfoBanner`.
   - Inside the div, it renders an `InfoBlock` component with the extracted `Title`, `Description`, `Icon`, and `Link`.
   - The `InfoBlock` also receives additional className props for styling, specifically using `classnames` to conditionally apply styles based on `isConfirmationPage`.

5. **Observer**: The component is wrapped with `observer` from `mobx-react` to ensure it reacts to changes in MobX state used within the component.