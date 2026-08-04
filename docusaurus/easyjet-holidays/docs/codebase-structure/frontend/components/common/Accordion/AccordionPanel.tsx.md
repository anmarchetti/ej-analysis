## Imports

The `AccordionPanel` component uses several imports:

- `React`, `FC`: Imported from `react`, `FC` is a type alias for `FunctionComponent`. It is used for typing the component as a functional component.
- `classNames`: A utility function from the `classnames` package that conditionally joins class names together.
- `HeightAnimatedContainer`: A custom React component imported from `frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer`. This component likely handles the animation of height properties for its children.
- `SvgChevronDown`: A React component representing a Chevron Down icon, imported from `frontend/components/icons-new/ChevronDown`.

## Structure

The `AccordionPanel` is structured as follows:

- **Props**: Defined by the `IAccordionPanelProps` interface:
  - `content`: `React.ReactNode` - the content to be displayed inside the accordion panel.
  - `panelId`: `string` - a unique identifier for the accordion panel.
  - `title`: `React.ReactNode` - the title of the accordion panel.
  - `isOpened`: `boolean` (optional) - a boolean indicating if the accordion panel is currently open.
  - `onTogglePanel`: `() => void` (optional) - a function to be called when the panel's open state needs to be toggled.
  
- **JSX Structure**:
  - The main container is a `div` with a dynamic class name that changes based on the `isOpened` prop. The `classNames` function is used to toggle between `accordion__panel` and `accordion__panel--open`.
  - The title of the panel is wrapped inside an `h3` tag with a class `accordion__title`. Inside this, there is a `button` that controls the opening and closing of the accordion panel. The button uses the `onTogglePanel` function for its `onClick` event and controls its accessibility with `aria-expanded`.
  - The `SvgChevronDown` icon is included next to the title inside the button.
  - The content of the panel is wrapped within a `HeightAnimatedContainer`, which likely handles the animation of the panel's height based on the `isOpened` state. The actual content is placed inside a `div` with the class `accordion__content`.

## Logic

- **Opening/Closing**: The accordion is controlled through a button within the title. Clicking this button triggers the `onTogglePanel` function, which is intended to toggle the state of `isOpened`. The actual state management is expected to be handled outside this component since `isOpened` and `onTogglePanel` are passed as props.
  
- **Accessibility**: The button controlling the accordion's state has an `aria-expanded` attribute that dynamically sets its value based on the `isOpened` prop, enhancing the component's accessibility by indicating to screen readers whether the accordion is open or closed.

- **Animation**: The `HeightAnimatedContainer` is used to animate the height of the accordion content. This component accepts `isOpened` as a prop and likely uses it to animate the height from 0 to auto (or vice versa), depending on whether the panel is opened or closed. The `keepMounted` prop suggests that the content remains in the DOM even when the accordion is closed, ensuring that state and focus within the content are preserved.