## Imports

The `BookingAlert` component uses several imports from different sources:

- **React Imports:**
  - `FC` (Function Component) and `useState` are imported from the React library, which are used to define the functional component and manage the component's state, respectively.

- **Sitecore JSS Imports:**
  - `Text` is imported from `@sitecore-jss/sitecore-jss-nextjs` to handle rendering of text fields from Sitecore.

- **Utility Imports:**
  - `classNames` is a utility function imported from the `classnames` package, which is used to conditionally apply CSS class names.

- **Type Imports:**
  - `ISitecoreField` is a TypeScript interface imported from a local model. It defines the structure for Sitecore fields.

- **Component Imports:**
  - `Button`, `RichTextWithLinks`, and three SVG components (`SvgChevronDown`, `SvgChevronUp`, `SvgInfoFilled`) are imported from local directories. These are used to build the UI of the `BookingAlert` component.

- **Style Import:**
  - `styles` is imported from `BookingAlert.module.scss`, which contains CSS modules for styling the component.

## Structure

The `BookingAlert` component is structured with the following main elements:

- **Container (`div`):** Acts as the root element with conditional classes applied based on whether it is inside a popup. It contains all other UI elements of the component.

- **Content Wrapper (`div`):** Encloses the title and content sections.

- **Title Container (`div`):**
  - Contains the `SvgInfoFilled` icon and the `Text` component which renders the `title` field.
  - The title's appearance changes based on whether the content is expanded or not.

- **Rich Text Content:** Rendered using `RichTextWithLinks`, which displays the `content` field. Visibility toggles based on the `isExpanded` state.

- **Button:** A transparent button that toggles the `isExpanded` state. It displays either the `SvgChevronUp` or `SvgChevronDown` icon depending on the current state. The `aria-label` is dynamically set based on the expansion state.

## Logic

The `BookingAlert` component utilizes React's `useState` hook to manage its internal state:

- **State:**
  - `isExpanded`: A boolean state initialized to `true`, which determines whether the content is expanded or collapsed.

- **Event Handlers:**
  - `onClick` handler for the button toggles the `isExpanded` state between true and false, which in turn toggles the visibility of the content and the icon displayed in the button.

- **Conditional Rendering:**
  - The component uses conditional class names and `aria-labels` based on the `isExpanded` state to enhance accessibility and user experience.
  - The `classNames` utility function is extensively used to apply classes conditionally based on the component's state and props (e.g., `isInPopup`).

This component effectively encapsulates the functionality required for a collapsible alert box, leveraging both internal state and props to control its behavior and appearance.