## Imports

The `HeaderTextWithIcon` component utilizes several imports:

- `FC` and `SVGProps` from the `react` package to define functional component types and SVG properties respectively.
- `classNames` from the `classnames` package, which is used for conditionally joining class names together.
- `styles` from a local SCSS module (`./HeaderTextWithIcon.module.scss`), which contains CSS classes that are applied to the component.

## Structure

The `HeaderTextWithIcon` component is structured as follows:

- **Props Interface (`IHeaderTextWithIconProps`)**: This TypeScript interface defines the shape of the props expected by the component:
  - `Icon`: A functional component that takes `SVGProps<SVGSVGElement>` and returns a JSX element. This represents an SVG icon.
  - `title`: A string that represents the header text.
  - `titleClassName`: An optional string for additional custom styling to be applied to the title.

- **Functional Component Definition (`HeaderTextWithIcon`)**:
  - The component is a functional component typed with `FC<IHeaderTextWithIconProps>`.
  - It deconstructs its props to get `Icon`, `title`, and `titleClassName`.
  - The JSX structure consists of a main `div` with a class `titleRow` (from the imported `styles` object). Inside this `div`, there are two nested `div`s:
    - The first nested `div` (`iconWrapper`) contains the `Icon`, which is passed SVG class properties through `styles.titleIcon`.
    - The second nested element is an `h2` header that displays the `title`. It uses the `classNames` function to combine predefined styles from `styles.title` and any additional classes passed through `titleClassName`.

## Logic

The component's logic primarily revolves around the dynamic application of CSS classes and the rendering of the `Icon` and `title`:

1. **Dynamic Class Names**:
   - The `h2` element's class name combines a default style (`styles.title`) with an optional `titleClassName` provided via props. This is achieved using the `classNames` utility, which effectively applies multiple class names to a single element based on the conditions provided.

2. **Icon Rendering**:
   - The `Icon` component is rendered within the `iconWrapper` `div`. It receives SVG specific properties (`className`) that determine how the icon should be styled.

3. **Conditional Styling**:
   - The use of `titleClassName` is optional. If it is not provided, only the default `styles.title` class is applied to the `h2` element. If provided, it enhances or overrides the default styling based on the additional classes.

By structuring and implementing the component in this way, it maintains flexibility and reusability, allowing for various icons and styles to be used as needed in different parts of an application.