## Imports

The `ButtonSwitch` component utilizes several imports:

- `FC` from `react`: Used to define the functional component type from React.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs`: A helper component for rendering text fields from Sitecore JSS.
- `classNames` from `classnames`: A utility function to conditionally join classNames together.
- `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField`: TypeScript interfaces for typing the Sitecore fields and images.
- `JSSImage` from `frontend/components/common/JSSImage`: A custom component for rendering images using Sitecore JSS.
- `styles` from `./ButtonSwitch.module.scss`: Module CSS for styling the component.

## Structure

The `ButtonSwitch` component is structured into two main interfaces and the functional component itself:

### Interfaces

1. **IButtonSwitchItem**
   - `icon`: A Sitecore field expected to contain an image.
   - `key`: A unique string identifier for the button.
   - `name`: A Sitecore field containing the button's display name.

2. **IButtonSwitchProps**
   - `activeIndex`: The index of the currently active button.
   - `items`: An array of `IButtonSwitchItem` objects.
   - `onClick`: A function that is called with the index of the button when it is clicked.
   - `children`: Optional children elements that can be rendered inside the component.

### Component

The `ButtonSwitch` is a React functional component that receives `IButtonSwitchProps` as props. The component structure includes:

- A main container `div` with a data attribute `data-tid='button-switch-container'`.
- A wrapper `div` that contains dynamically generated buttons based on the `items` prop.
- Each button is styled and made interactive with an `onClick` handler that triggers the provided `onClick` function with the index of the clicked button.
- Optionally, any children passed to the component are rendered after the buttons.

## Logic

The core functionality of the `ButtonSwitch` component revolves around button interaction and display based on the `activeIndex`:

1. **Button Generation**:
   - The `items` array is mapped over to create a button for each item.
   - Each button is assigned a unique `key` based on the item's name and its index in the array.
   - The `className` for each button is dynamically set using the `classNames` function to include the `active` class if the button's index matches the `activeIndex`.

2. **Active State Handling**:
   - When a button is clicked, the `onClick` function is called with the index of that button. This allows the parent component to manage the state of `activeIndex` based on user interaction.

3. **Conditional Rendering**:
   - The component conditionally renders the `children` prop if it is provided, allowing for additional content to be included within the component's layout without altering its primary functionality.

This component is designed to be reusable and adaptable for different scenarios where a button switch mechanism is needed, with support for both text and images as part of the button content.