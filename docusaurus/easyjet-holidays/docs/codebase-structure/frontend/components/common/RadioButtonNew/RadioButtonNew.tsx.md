## Imports

The component `RadioButtonNew` utilizes several imports to function properly:

- `React, { FC }` from 'react': Importing React and the Function Component type (FC) from the React library to create a functional component.
- `classNames` from 'classnames': A utility function used for conditionally joining class names together.
- `{ IRadioButtonNewProps }` from './interfaces': Importing the TypeScript interface `IRadioButtonNewProps` which defines the expected structure of the props passed to the component.
- `styles` from './RadioButtonNew.module.scss': Importing CSS modules specific to the `RadioButtonNew` component for styling.

## Structure

The `RadioButtonNew` component is structured as a functional component using React's FC type with `IRadioButtonNewProps` as its props type. The component returns a single `label` element that wraps an `input` element of type radio and optionally a `span` element if a label is provided. It also supports rendering children passed to it.

Here's a breakdown of the JSX structure:

- **label element**: Acts as a container and is styled conditionally based on the props such as `disabled`, `checked`, and `pill`. It uses the `classNames` function to combine classes conditionally. The `data-tid` attribute is used for testing purposes, and `htmlFor` is set to the id of the input element to link the label.
- **input element**: A radio button input where its state and behaviors are controlled by props like `name`, `checked`, `disabled`, `readOnly`, `onChange`, and `value`. The `onChange` handler is invoked if provided.
- **span element**: This is conditional based on the presence of the `label` prop. It displays the label text and can be styled using `labelClass`. It also supports `data-cs-mask` for additional data handling.

## Logic

The component's logic is primarily focused on handling the visual presentation and interaction of the radio button:

- **Conditional Styling**: The `classNames` utility is used to apply CSS classes conditionally based on the component's props (e.g., applying the `disabled` style if the `disabled` prop is true).
- **Accessibility**: The `htmlFor` prop in the label ensures that clicking the label toggles the radio button, enhancing accessibility.
- **Controlled Component**: The radio button is a controlled component, with its `checked` state managed by the parent component through the `checked` prop. The `onChange` handler allows the parent component to update the state when the radio button's value changes.
- **Default Values**: The `value` prop defaults to 'on' if not provided, ensuring that the radio button always has a value.
- **Children Rendering**: The component can render additional React nodes passed as children, allowing for more complex structures inside the label if necessary.

This component is designed to be reusable and configurable, adapting to various needs based on the props provided, while ensuring good practices like accessibility and controlled component behavior.