## Imports

The RadioButton component uses the following imports:

- `React, { FC }` from the 'react' library: This import brings in the React library functionality and the `FC` (Function Component) type from React, which is used to type the component.
- `classNames` from 'classnames': This utility is used to conditionally join classNames together. It is used in this component to dynamically generate the class string based on the component's props.

## Structure

The `RadioButton` component is structured as follows:

### Interface: `IRadioButtonProps`
This interface defines the props that the `RadioButton` component accepts:
- `checked`: Optional boolean that indicates whether the radio button is selected.
- `children`: Optional React nodes that can be passed as additional content.
- `className`: Optional string for additional custom class names.
- `csMask`: Optional boolean that indicates if content security masking is applied.
- `dataTid`: Optional string for test identifier.
- `disabled`: Optional boolean that disables the radio button when true.
- `id`: Optional string that defines the ID of the input element.
- `label`: Optional string or JSX element that represents the label of the radio button.
- `labelClass`: Optional string for additional class names for the label.
- `name`: Optional string that specifies the name of the input element.
- `onChange`: Optional function for handling change events.
- `pill`: Optional boolean that, when true, styles the radio button with a pill-like appearance.
- `readOnly`: Optional boolean that makes the radio input read-only.
- `value`: Optional string or number that represents the value of the radio button.

### Component Function: `RadioButton`
The `RadioButton` is a functional component that uses the props defined in `IRadioButtonProps`. It returns a `label` element that wraps an `input` of type `radio` and optionally a `span` for the label and any children passed to it.

## Logic

### Class Name Handling
The `className` on the `label` element is dynamically generated using the `classNames` function. It is based on several conditions:
- Always includes 'radio'.
- Adds 'radio--disabled' if `props.disabled` is true.
- Adds 'radio--checked' if `props.checked` is true.
- Adds 'radio--pill' if `props.pill` is true.
- Includes any additional class names passed via `props.className`.

### Input Element
The `input` element of type `radio` is controlled by the following props:
- `name`, `checked`, `disabled`, `readOnly`, `value`, and `id` are directly passed as attributes.
- `onChange` is passed if provided, and it is triggered on the change event.
- The default value for the `value` attribute is 'on' if not specified.

### Label
If a `label` is provided, a `span` element is rendered next to the input. It uses the `classNames` function to add 'radio__label' and any additional classes from `props.labelClass`. The `data-cs-mask` attribute is conditionally added based on the `csMask` prop.

### Children
Any additional React nodes passed as `children` are included inside the `label` after the `span` containing the label text.