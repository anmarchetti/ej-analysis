### Imports

The code snippet begins by importing various modules and components:

- `classNames`: A utility function from the `classnames` package used to conditionally join class names together.
- `ChevronDown`: A React component imported from `frontend/components/icons-new/ChevronDown`, representing a downward chevron icon.
- `styles`: Specific module CSS imported from `./GuestDetailsBlock.module.scss` which contains styles specific to the components defined in this file.

### Structure

The component defined in the code is `GuestDetailsHeader`, which is a functional React component utilizing TypeScript. It accepts props defined by the `IGuestDetailsHeadProps` interface:

- `icon`: A JSX element for displaying an icon.
- `title`: A string representing the title text.
- `disabled`: An optional boolean indicating if the header is interactive.
- `isExpanded`: An optional boolean to control the visibility of some UI elements, defaulting to `true`.
- `onClick`: An optional function for handling click events.
- `secondaryText`: An optional string for additional text display.

The component structure includes:
- A main div that conditionally renders as a button if the `disabled` prop is `false`. This button, when present, handles click events with the `onClick` function.
- Inside the main div or button, there are two sub-divs:
  - The first sub-div contains:
    - An icon wrapped in an `<i>` tag with a class from `styles.icon`.
    - A `<span>` for the title, using a class from `styles.title`.
    - Conditionally, if `secondaryText` is provided, a `<span>` for displaying this text using a class from `styles.secondaryText`.
  - The second sub-div displays the `ChevronDown` icon within an `<i>` tag. The class applied to this tag is dynamically generated using `classNames` to include `styles.expanded` when `isExpanded` is true.

### Logic

The component's rendering logic is as follows:

1. **Content Composition**: The content of the header is composed into a variable `content`. This includes the icon, title, optional secondary text, and a chevron icon whose class changes based on whether the header is expanded.

2. **Conditional Rendering**: 
   - If the `disabled` prop is `true`, the `content` is rendered directly without being wrapped in a clickable button.
   - If `disabled` is `false`, the `content` is wrapped in a `<button>` element to make it interactive, with an `onClick` handler provided by the props.

3. **Dynamic Styling**:
   - The chevron icon's styling changes based on the `isExpanded` prop to visually indicate whether the content it pertains to is expanded or not.
   - The use of `classNames` allows for easy toggling of CSS classes based on component state or props.

This structure and logic ensure that `GuestDetailsHeader` is a reusable and customizable component suitable for displaying a header that can be interactively expanded or collapsed, with optional additional text and custom icons.