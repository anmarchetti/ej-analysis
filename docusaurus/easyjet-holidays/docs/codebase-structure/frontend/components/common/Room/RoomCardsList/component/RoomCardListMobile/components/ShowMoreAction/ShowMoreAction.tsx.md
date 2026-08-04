## Imports

The `ShowMoreAction` component utilizes several imports from different sources to function properly:

1. **Button Component**: Imported from `frontend/components/common/Button`. This is a reusable button component which is likely styled and configured to be used across the application.

2. **SvgExternalLink Component**: Imported from `frontend/components/icons-new/ExternalLink`. This component is responsible for rendering an SVG icon, specifically an external link icon in this case.

3. **Styles**: Imported from `./ShowMoreAction.module.scss`. This is a CSS module specific to the `ShowMoreAction` component. It helps in applying scoped styles to this component without affecting other parts of the application.

## Structure

The `ShowMoreAction` component is a functional component that accepts props defined by the `IShowMoreActionProps` interface:

- **label** (optional): A `string` that represents the text to be displayed on the button.
- **onClick** (optional): A function that will be executed when the button is clicked.

The component is structured as follows:

- A `Button` component is rendered with several props:
  - **isOutlined**: A boolean indicating the button should have an outlined style.
  - **isFullWidth**: A boolean to make the button span the full width of its container.
  - **onClick**: The function to call when the button is clicked, passed down from the props.
  - **data-tid**: A test identifier, 'show-more-rooms-button-mobile', used for testing purposes.
  - **className**: A class name from the imported styles, specifically `styles.showMore` to apply specific CSS styles.
  - **aria-label**: Accessibility label which is set to the value of the `label` prop.
  
  Inside the `Button`, the `label` prop's value is displayed as the button's text, followed by the `SvgExternalLink` icon component, which also receives a class `styles.btnIcon` for styling.

## Logic

The component's logic is straightforward:

- **Conditional Rendering**: The `Button` component displays the text and icon only. The presence of the `label` and `onClick` props are optional, allowing flexibility in how the button is used.

- **Accessibility**: By using `aria-label`, the component enhances its accessibility by providing screen readers with meaningful information about the button's function.

- **Styling**: The component leverages CSS modules for styling, which helps in maintaining the styles scoped to the component, avoiding potential conflicts with other styles in the application.

- **Event Handling**: The `onClick` function is passed directly to the `Button` component's `onClick` prop, allowing the parent component to define what happens when the button is clicked.

This component is primarily used for displaying a button with an optional label and an icon, which when clicked, can trigger an action defined by the parent component.