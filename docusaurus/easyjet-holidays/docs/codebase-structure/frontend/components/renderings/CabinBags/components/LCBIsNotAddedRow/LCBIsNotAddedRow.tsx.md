## Imports

The component imports several modules and resources:

- `React` and `FC` (Function Component) from `react` for creating the component.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.
- `classNames` from `classnames` to conditionally join class names together.
- `useStore` custom hook from `frontend/hooks/useStore` to access the Redux store state.
- `TStores` type from `frontend/store/IStores` to type the store state.
- `ICabinBagsFields` interface from `models/data/ICabinBagsFields` to type the fields prop in the component.
- `JSSImage` from `frontend/components/common/JSSImage` for rendering images managed by Sitecore.
- Component-specific styles from `./LCBIsNotAddedRow.module.scss`.

## Structure

The component `LCBIsNotAddedRow` is defined as a functional component using TypeScript. It accepts props of type `ILCBIsNotAddedRowProps`, which includes:

- `fields`: An object of type `ICabinBagsFields` containing Sitecore-managed fields.
- `hasLCB`: A boolean indicating if the low-cost bag (LCB) has been added.
- `isLackOfCapacity`: A boolean indicating if there is a lack of capacity for adding more bags.

### Props Interface: `ILCBIsNotAddedRowProps`

Defines the structure for the component's props, ensuring type safety.

## Logic

The component uses the `useStore` hook to access the Redux store and extracts `isPostBookingPages` from `layoutStore` to determine if the current page is a post-booking page.

### Conditional Rendering

1. **Capacity Check**:
   - If `isLackOfCapacity` is `true` and `isPostBookingPages` is `false`, it renders a `div` with a class `noCapacity`. This `div` contains a `Text` component that displays the `NoMoreLCBCapacityLabel` field.
   - This scenario handles cases where no more bags can be added due to capacity constraints before booking completion.

2. **Default Case**:
   - Renders a `span` with a conditional class name that hides the element if `hasLCB` is `true` (using `classNames` utility).
   - This `span` includes:
     - An `JSSImage` component displaying the `OverheadIcon` field.
     - A `Text` component displaying the `OverheadBagDropdownLabel` field.
   - This default case handles the UI for when an LCB has not been added but there is capacity to add one.

### Data Attributes

- `data-tid='lcb-price-panel-bags-no-capacity'`: Used for targeting the no capacity message in tests.
- `data-tid='lcb-price-panel-bags-no-added'`: Used for targeting the default case message in tests.
- `data-tid='overhead-bag-not-added-icon'`: Used for targeting the icon in tests.

This structure and logic ensure that the component behaves correctly based on the booking page context and the availability of adding more cabin bags.