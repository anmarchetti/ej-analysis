## Imports

The component imports several modules and components which are essential for its functionality:

- `classnames`: A utility function to conditionally join class names together.
- `IValidationError`: An interface from `models/data/validation` that defines the structure for validation error objects.
- `ValidationIcon`: A React component from `frontend/components/common/ValidationIcon` used to display a validation icon based on the error state.
- `getErrorText`: A utility function from `./validatableField.utils` that returns error text based on the provided error object.
- `useValidatableField`: A custom React hook from `./ValidatableFieldNew.utils` that manages the field state and validation logic.
- `styles`: Module CSS imported from `./ValidatableFieldNew.module.scss` for styling the component.

## Structure

The `ValidatableFieldNew` component is defined with the following props structured as `IValidatableFieldNewProps`:

- Basic input properties such as `id`, `type`, `label`, `value`, `placeholder`, `onChange`, and `disabled`.
- Validation-related props like `errors` and `hideError`.
- Optional UI customization props such as `afterFieldRender`, `ariaLabel`, `autoComplete`, `blurTransform`, `children`, `fieldClassName`, `inputMode`, `maxLength`, `onFocus`, `postfix`, `prefix`, `submitted`, and `vertical`.

The component structure includes:
- A main wrapper `div` that dynamically applies classes based on the field state (`touched`, `focused`, `hasError`, `disabled`).
- Inside the main wrapper, it contains:
  - A `content` div that can be styled vertically if specified.
  - A `fieldWrapper` which includes:
    - Optional `prefix` and `postfix` elements.
    - An `input` element for user interaction.
    - A `label` associated with the input.
    - The `afterFieldRender` prop which allows rendering additional elements after the input field.
  - An error message section that appears if there is an error and it is not hidden.
  - The `children` prop which can be a React node or a function returning a React node based on the internal state.

## Logic

The component utilizes the `useValidatableField` custom hook to manage its state and handle validation logic. The hook returns:
- `hasError`: A boolean indicating if there are any validation errors.
- `isErrorShown`: A boolean to control the visibility of the error message.
- `state`: An object containing boolean flags `blurred`, `focused`, and `touched`.
- `onBlur` and `onFocus`: Event handlers for blur and focus events on the input field.
- `validIcon`: A React node of a validation icon to be displayed when the field is valid.
- `getPhrase`: A function to retrieve specific phrases or text.
- `isTradePortal`: A boolean that could be used for conditional styling or logic specifically for trade portals.

The component handles changes and interactions through:
- An `onChange` handler passed to the input to update the value.
- Custom `onBlur` and `onFocus` handlers provided by the hook to manage field focus state and perform transformations or additional logic on blur.
- Conditionally rendering error messages and validation icons based on the state of validation and the `hideError` prop.
- Support for customizing input behavior and appearance using various props like `inputMode`, `maxLength`, `autoComplete`, and more.

This structure and logic ensure that the `ValidatableFieldNew` component is flexible and robust for various use cases involving input fields with validation requirements.