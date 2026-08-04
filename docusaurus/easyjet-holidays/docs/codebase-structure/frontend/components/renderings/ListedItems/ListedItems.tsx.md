## Imports

The `ListedItems` component utilizes several imports:

- `FC` from `react` is used to define the functional component type.
- `classNames` from `classnames` helps in conditional and dynamic styling.
- `ISitecoreChildren`, `ISitecoreField`, and `ISitecoreImage` are imported from specific model paths and are used for typing the props related to Sitecore-managed content.
- `ListedItem` is a component imported from the current directory, used to render each item in the list.
- `styles` from `Listeditems.module.scss` imports specific module styles which are scoped to this component only.

## Structure

### `IListItemsProps` Interface

This interface defines the props that the `ListedItems` component accepts:

- `className`: Optional string for CSS class names.
- `customItems`: An optional array of items with each item containing an icon (with `alt` and `src` attributes) and a label.
- `fields`: An optional object containing `Items`, which is an array of `ISitecoreChildren`. Each child has an `Icon` and a `Label`.
- `isMultiColumn`: A boolean to determine if the items should be displayed in multiple columns.
- `itemClassName`: Optional string for CSS class names for each item.

### Constants

Two constants control the display of items:

- `MAX_PER_COLUMN`: Maximum number of items per column when in multi-column mode.
- `MAX_ITEMS`: Maximum number of items to display when in multi-column mode.

### Component Definition

`ListedItems` is a functional component that calculates and renders a list of items based on the props provided. It supports both single column and multi-column layouts.

## Logic

1. **Item Resolution**: Determines the source of the items. If `customItems` is provided, it uses that; otherwise, it maps over `fields.Items` to resolve the items.

2. **Early Exit**: If no items are resolved (`resolvedItems.length` is zero), the component returns `null`.

3. **Item Slicing**: In multi-column mode, the items are sliced according to `MAX_ITEMS` and further divided into two columns using `MAX_PER_COLUMN`. In single-column mode, all items are displayed as is.

4. **Conditional Rendering**:
   - In multi-column mode, items are divided into two `<ul>` elements, each representing a column. The `classNames` function is used to dynamically assign classes.
   - In single-column mode, all items are rendered within a single `<ul>`.

5. **ListedItem Component**: Each item is rendered using the `ListedItem` component, passing the `icon`, `label`, and `itemClassName`.

By using conditional rendering and dynamic class assignment, the `ListedItems` component is flexible and can adapt to different layouts and data sources.