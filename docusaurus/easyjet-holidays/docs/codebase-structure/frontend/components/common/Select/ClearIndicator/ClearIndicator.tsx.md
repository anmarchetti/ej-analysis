### Imports

The `ClearIndicator` component utilizes several imports:

- **react-select**: Specifically, it imports `components` from `react-select`, which are pre-built components that can be customized. Here, `components.ClearIndicator` is used to extend or customize the default clear indicator component of a select input.
  
- **classnames**: A utility function `classnames` is used to conditionally join class names together. This is helpful in applying multiple class names to a component based on certain conditions.
  
- **Cross**: This is a custom React component imported from `frontend/components/icons-new/Cross`, presumably representing a cross icon (typically used for clearing content).
  
- **styles**: Style module imported from `./ClearIndicator.module.scss` to apply CSS modules styling to the component. This ensures that all class names are scoped locally to the component rather than globally.

### Structure

The `ClearIndicator` component is a functional component that accepts props:

- **className**: An optional string to apply additional custom class names passed to the component.
- **onMouseDown**: An optional function that handles the `onMouseDown` event. This is particularly useful for custom interactions when the user clicks on the clear indicator.
- **...props**: A spread operator to pass any additional props to the `components.ClearIndicator`.

The component conditionally renders its children based on the presence of the `onMouseDown` prop:

- If `onMouseDown` is provided, it renders a `button` element of type 'button'. This button contains an icon (`<i>` element) which itself includes the `<Cross />` component. The `button` handles the `onMouseDown` event.
  
- If `onMouseDown` is not provided, it directly renders the `<i>` element containing the `<Cross />` component.

Both render paths use the `classNames` function to dynamically generate the class name for the `<i>` element, combining `styles.clearIndicator` and any `className` provided as a prop.

### Logic

The core functionality of the `ClearIndicator` component is to provide a customizable UI element (using React Select's `components.ClearIndicator`) that users can interact with, typically to clear the selected value in a dropdown input. The logic can be summarized as follows:

- **Conditional Rendering**: The component decides whether to render a clickable button or a simple icon based on whether an `onMouseDown` handler is provided. This flexibility allows the component to either be interactive or purely informational based on the needs of the parent component.
  
- **Event Handling**: By handling the `onMouseDown` event at the button level (when provided), the component ensures that any specified logic for clearing the input (or other actions) is executed right when the user presses the mouse button, making the UI responsive and intuitive.
  
- **Styling**: Using both CSS modules and the `classnames` utility, the component applies styles conditionally. This approach maintains style encapsulation and allows for easy modifications of the component's appearance based on its state or passed props.