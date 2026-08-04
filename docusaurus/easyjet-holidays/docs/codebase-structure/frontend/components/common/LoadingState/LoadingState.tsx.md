## Imports

The `LoadingState` component uses several imports to function properly:

- `React, { FunctionComponent } }` from 'react': This import brings in React and the `FunctionComponent` type from the React library, which is used to type the component as a function component.
- `classNames` from 'classnames': This utility function is used for conditionally joining class names together. It is particularly useful when you want to apply multiple class names to a component based on certain conditions.
- `styles` from './LoadingState.module.scss': This imports CSS module styles from a SCSS file. CSS modules allow for CSS to be bundled into the JavaScript, providing scoped styles to the component.

## Structure

The `LoadingState` component is structured as follows:

1. **Component Definition**:
   - The `LoadingState` is defined as a functional component using the `FunctionComponent` type from React. It accepts an optional prop `useMasonryStyle` which is a boolean.
   
2. **JSX Structure**:
   - The outermost `div` element uses `classNames` to conditionally apply classes based on the `useMasonryStyle` prop. It always applies `styles.sizeContainer` and 'no-print', and conditionally applies `styles.masonry` if `useMasonryStyle` is true.
   - Inside the outer `div`, there is another `div` with a class of `styles.container`.
   - Within this container, there is a `div` with the class `styles.contentContainer`, which houses three `div` elements:
     - A title placeholder with shimmer effect (`styles.shimmerTitle`).
     - Two line placeholders with shimmer effects (`styles.shimmerLine` and `styles.shimmerLine2`).
   - There is also a separate `div` outside the `contentContainer` but inside the `container`, which acts as a button placeholder with a shimmer effect (`styles.shimmerButton`).

3. **Data Attributes**:
   - The outermost `div` element includes a `data-tid` attribute with the value `cancel-booking-banner-loading`. This can be used for testing purposes to easily locate the element.

## Logic

The `LoadingState` component utilizes basic logical operations to dynamically assign class names:

- **Conditional Class Application**:
  - The `classNames` function is used extensively to apply CSS classes conditionally. For example, the `useMasonryStyle` prop determines whether the `styles.masonry` class is added to the `sizeContainer`.
  - The `classNames` function is also used to combine static and dynamic class names, as seen with the shimmer effect placeholders (`placeholder-shimmer` along with specific shimmer styles).

- **Props**:
  - The component accepts a single prop `useMasonryStyle`, which influences the styling of the component. This prop is optional and defaults to `false` if not provided.

- **Styling**:
  - Styling is handled through SCSS modules, which allow styles to be composed locally, avoiding conflicts and promoting easier maintenance and reusability.

This component is designed to display a loading state UI with shimmer effects, commonly used in modern web applications to indicate content is loading. The optional `useMasonryStyle` allows for flexibility in how the loading placeholders are displayed, catering to different layout needs.