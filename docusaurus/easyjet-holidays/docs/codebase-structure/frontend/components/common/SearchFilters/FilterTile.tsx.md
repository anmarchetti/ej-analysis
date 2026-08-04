## Imports

The `FilterTile` component uses several imports:

- `React, { PureComponent }` from the `react` package: This imports React and its `PureComponent` class which `FilterTile` extends. `PureComponent` helps optimize performance by reducing the need to re-render components if their props or state do not change.
- `classNames` from the `classnames` package: This utility function is used for conditionally joining class names together based on certain conditions.
- `FilterGroupCodes` from `models/enum/FilterGroupCodes`: This is likely an enumeration that defines possible group codes for filters, used to manage various filter types.
- `SvgChevronDown`, `SvgChevronRight`, `SvgChevronUp`, and `SvgTick` from `frontend/components/icons-new`: These imports are React components that render specific SVG icons, used within the `FilterTile` component to visually indicate different states like active, inactive, etc.

## Structure

The `FilterTile` component is structured as follows:

- **Props Interface (`IFilterTileProps`)**: Defines the types and structure expected for the props passed into the component. These include:
  - `code`: A value from `FilterGroupCodes` indicating the type of filter.
  - `isActive`: A boolean indicating if the filter is currently active.
  - `isDisabled`: A boolean indicating if the filter is disabled.
  - `onClick`: A function that is called when the filter tile is clicked, passing the `code`.
  - `title`: A string representing the title of the filter.
  - `isScreenExtraSmall`: An optional boolean that indicates if the screen size is extra small, which affects the rendering of icons.

- **Class Definition (`FilterTile`)**: Extends `PureComponent` and includes:
  - **Private Class Methods (`tileClassName` and `iconClassName`)**: These methods use `classNames` to determine the CSS classes for the tile and icon based on the component's props.
  - **Event Handler (`onClick`)**: A method that triggers the `onClick` prop function if the tile is not disabled.
  - **Render Method**: Defines the JSX structure of the component, conditionally rendering icons and styles based on the component's props.

## Logic

The component's logic primarily revolves around conditional rendering and class assignment:

- **Class Names**: The `tileClassName` and `iconClassName` methods dynamically generate class names based on the `isActive` and `isDisabled` props. This affects the visual representation of the filter tile in terms of styling and interaction cues.
  
- **Click Handling**: The `onClick` method handles click events on the button element. It checks if the filter is disabled and, if not, invokes the passed `onClick` function with the filter's code.

- **Conditional Rendering**:
  - Icons are rendered differently based on the `isScreenExtraSmall` prop. For normal screen sizes, a chevron icon pointing up or down is shown based on the `isActive` state. For extra small screens, a tick icon is shown next to a right-pointing chevron if the filter is active.
  - The `title` of the filter is always displayed within a `<span>` element.

This structured approach ensures that the `FilterTile` component is both flexible and efficient, adapting its layout and functionality based on its environment and state.