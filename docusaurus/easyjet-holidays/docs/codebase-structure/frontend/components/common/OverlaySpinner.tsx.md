## Imports

The component imports several modules and resources:

- `React`, specifically the `memo` and `useEffect` hooks, from the 'react' library. `memo` is used to optimize performance by memoizing the component, and `useEffect` is for side effects in the component lifecycle.
- `setBodyOverflow` from 'frontend/utils/ui.utils', a utility function likely used to manipulate the CSS overflow property of the body element.
- `IconLock` from 'frontend/components/icons/Lock', a React component that renders an icon, used as the default icon in the `OverlaySpinner` component.

## Structure

The `OverlaySpinner` component is structured as follows:

- **Props**: It accepts three optional props:
  - `description` (string): Text content providing additional details.
  - `header` (string): Text content for the header of the spinner.
  - `icon` (JSX.Element): A React element to display as the icon, with a default value of `<IconLock />`.
  
- **JSX Structure**:
  - The component returns a `div` with a class name of `overlay-spinner`, which acts as the main container.
  - Inside this container, there is another `div` with a class `overlay-spinner__container` that wraps the content of the spinner.
  - The icon container `div` (`overlay-spinner__icon-container`) includes another `div` (`overlay-spinner__icon`) intended for styling purposes, followed by the `icon` prop.
  - Conditional rendering is used for `header` and `description`. If these props are provided, they are rendered inside their respective `div` elements with class names `overlay-spinner__header` and `overlay-spinner__description`.

## Logic

- **useEffect Hook**: The `useEffect` hook is used to execute side effects related to DOM manipulation:
  - On component mount, it calls `setBodyOverflow('hidden')` to hide the scrollbar and prevent scrolling.
  - It returns a cleanup function that resets the body overflow style by calling `setBodyOverflow('')` when the component unmounts, restoring the default scrolling behavior.
  
- **Memoization**: The `memo` function wraps the `OverlaySpinner` component to prevent unnecessary re-renders. It will only re-render if any of its props change, which is beneficial for performance, especially in complex applications.

This component is designed to provide a customizable and performant loading spinner overlay, which can be useful in scenarios where asynchronous operations block user interaction.