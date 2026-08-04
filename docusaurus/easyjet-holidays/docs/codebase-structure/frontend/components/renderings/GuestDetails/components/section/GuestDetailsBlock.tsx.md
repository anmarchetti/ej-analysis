## Imports

The code imports several modules and components necessary for its operation:

- `useState` from `react`: A React hook used for state management within functional components.
- `classNames`: A utility function for conditionally joining class names together.
- `AnimatedWrapper`: A custom component imported from `frontend/components/common/AnimatedWrapper/AnimatedWrapper`, presumably used for adding animations to component rendering.
- `GuestDetailsHeader`: A component specific to this module, used for rendering the header section of the guest details block.
- `styles`: Module-specific styles imported from `./GuestDetailsBlock.module.scss`, which contains CSS module styles.

## Structure

The `GuestDetailsBlock` component is defined as a functional component using TypeScript. It accepts several props:

- `icon`: A JSX element to be displayed as an icon.
- `title`: A string for the title of the block.
- `children`: Optional React nodes to be displayed inside the block.
- `disabled`: An optional boolean to disable interaction.
- `id`: An optional string that represents the HTML id attribute.
- `ignoreAnimation`: An optional boolean to control whether animations should be ignored.
- `isLead`: An optional boolean to indicate if the current guest is the lead, affecting the initial expanded/collapsed state.
- `secondaryText`: Optional string for additional text.
- `wrapperClassName`: An optional string for additional CSS class names.

The component maintains an internal state `isExpanded` to manage the expand/collapse state of the component.

## Logic

- **Initial State and Expansion Logic**:
  - The `isExpanded` state starts as `null` to differentiate between the initial render and subsequent updates.
  - If `isExpanded` is `null`, the component checks `isLead` to determine if it should be expanded or collapsed by default.
  - Once the user interacts, `isExpanded` is set to a boolean value, indicating the user has explicitly expanded or collapsed the component.

- **Conditional Class Application**:
  - `classNames` function is used to dynamically apply CSS classes based on the component's state and props. For example, it applies the `disabled` style if the `disabled` prop is true, and `ignoreAnimation` style based on the `ignoreAnimation` prop or if `isExpanded` is still `null`.

- **Header Interaction**:
  - The `GuestDetailsHeader` component is rendered with an `onClick` handler that toggles the `isExpanded` state, which in turn toggles the expand/collapse state of the content.

- **Content Rendering**:
  - The `AnimatedWrapper` component is used to wrap the `children` prop, providing entrance and exit animations based on the `isShown` state. It only mounts if the component is not disabled.

This structure and logic allow the `GuestDetailsBlock` to serve as a flexible UI component for displaying guest details with optional animations and expand/collapse functionality.