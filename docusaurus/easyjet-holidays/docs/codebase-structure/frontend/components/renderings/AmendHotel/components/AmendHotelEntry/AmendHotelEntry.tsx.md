## Imports

The `AmendHotelEntry` component imports several modules and utilities to function properly:

- `FunctionComponent` from `react`: Utilized for typing the functional component.
- `observer` from `mobx-react`: Enhances the component to reactively update when observables change.
- `useStore` from `frontend/hooks/useStore`: A custom hook to access MobX stores.
- `IHolidaysStores` from `frontend/store/holidays`: Interface that describes the shape of the stores related to holiday functionality.
- `Button` from `frontend/components/common/Button`: A reusable button component.

## Structure

### Interface Definition

- `IAmendHotelEntry`: Props definition for the `AmendHotelEntry` component.
  - `onClick`: Function to execute when the button is clicked, accepting a `React.MouseEvent`.
  - `label?`: Optional string to be displayed on the button.

### Component Definition

- `AmendHotelEntry`: A functional component typed with `FunctionComponent<IAmendHotelEntry>`.
  - Destructures `label` and `onClick` from props.
  - Uses the `useStore` hook to extract `isAmendCTAVisible`, `isAmendCTADisabled`, and `isLoadingAlternativeHotels` from the `amendHotelStore`.

### Rendering

- Conditionally returns `null` if `isAmendCTAVisible` is false.
- Returns a `Button` component with several props:
  - `isOutlined` and `isSmall` are set to enhance the button's styling.
  - `dataTid` provides a test ID for easier testing.
  - `disabled` and `isLoading` states are derived from the store's state.
  - The button displays the `label` prop and triggers the `onClick` function when clicked.

## Logic

1. **Store Subscription**: The component subscribes to specific fields in the `amendHotelStore` using the `useStore` hook. This ensures that the component re-renders reactively when these fields change.
2. **Conditional Rendering**: The component renders nothing if `isAmendCTAVisible` is false, making it conditionally visible based on the store's state.
3. **Button State Management**: The button's disabled and loading states are managed based on the store's `isAmendCTADisabled` and `isLoadingAlternativeHotels` respectively.
4. **MobX Reactivity**: Wrapped with `observer` to make the rendering reactive to MobX state changes in the stores it subscribes to.

This setup allows the `AmendHotelEntry` component to be highly responsive and integrated within a larger application architecture that uses MobX for state management and React for the UI.