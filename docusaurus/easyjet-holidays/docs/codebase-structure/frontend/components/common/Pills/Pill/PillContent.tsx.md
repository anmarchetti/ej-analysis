## Imports

The `PillContent` component utilizes several imports:

- `FC` from `react`: Importing `FC` (Function Component) from React for typing the functional component.
- `classNames` from `classnames`: A utility function to conditionally join class names together. It's used to dynamically assign CSS classes based on the component's props.
- `styles` from `./Pill.module.scss`: Module CSS for scoped styling of the component. This import ensures that styles do not leak into other components.

## Structure

The `PillContent` component is structured as follows:

- **Props**: Defined by the `IPillContentProps` interface:
  - `dotted` (boolean): Determines if the title has a dotted style.
  - `ellipsis` (boolean): Determines if the title text should be truncated with an ellipsis.
  - `contentClass` (optional string): Additional CSS class for the main container.
  - `dataTid` (optional string): Test identifier for the main container.
  - `icon` (optional JSX.Element): Icon element to be rendered.
  - `iconClass` (optional string): Additional CSS class for the icon container.
  - `title` (optional string): Text content for the title.
  - `titleClass` (optional string): Additional CSS class for the title container.

- **JSX Structure**:
  - The main container (`div`) utilizes `classNames` to combine `styles.content` with `contentClass`. It also optionally includes a `data-tid` attribute for testing.
  - An optional `icon` element is wrapped inside a `div`, with combined classes from `styles.iconWrapper` and `iconClass`.
  - The title (`p`) combines classes from `styles.titleWrapper`, `titleClass`, and conditionally adds `styles.dotted` and `styles.ellipsis` based on the props.

## Logic

The component's logic primarily revolves around conditional rendering and class assignment:

- **Conditional Rendering**:
  - The `icon` is only rendered if it is provided (`icon && (...)`).
  
- **Dynamic Class Assignment**:
  - The `classNames` utility is extensively used to dynamically assign classes based on the component's props. This is evident in:
    - The main container, where `contentClass` is optionally included.
    - The icon container, where `iconClass` is optionally included.
    - The title, where `titleClass` is used and conditional styles (`styles.dotted` and `styles.ellipsis`) are applied based on the `dotted` and `ellipsis` boolean props.

This structure and logic ensure that the `PillContent` component is highly reusable and adaptable to different styling and functional requirements.