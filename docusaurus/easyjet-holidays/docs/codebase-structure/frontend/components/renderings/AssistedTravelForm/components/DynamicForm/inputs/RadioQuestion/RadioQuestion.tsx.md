## Imports

The `RadioQuestion` component uses several imports from both internal modules and third-party libraries:

- **React Essentials**: Imports `FC` (FunctionComponent) and `memo` from `react` for creating a memoized functional component.
- **Classnames Utility**: Imports `classNames` from `classnames` for conditionally joining classNames together.
- **Custom Components**:
  - `RadioButton`: A custom radio button component.
  - `RichTextWithLinks`: A component to render text with embedded links.
  - `ErrorMessage`: Displays error messages.
  - `QuestionHeader`: Renders the header of the question including title and description.
- **Styles**:
  - `inputStyles`: Specific module SCSS styles for input components.
- **Type Definitions**:
  - `IQuestionProps`: Interface for the props accepted by the `RadioQuestion` component.
- **Utilities**:
  - `getUniqueIds`: A utility function to generate unique IDs for accessibility attributes.

## Structure

The `RadioQuestion` component is structured as follows:

- **Fieldset Element**: The main container, which uses the `fieldset` HTML element, facilitates grouping of related elements in a form. It includes accessibility attributes such as `aria-labelledby`, `aria-invalid`, and `aria-errormessage`.
- **QuestionHeader**: Renders the question's label and description as a legend within the fieldset.
- **Radio Buttons**:
  - Mapped from `question.options`, creating a `RadioButton` for each option.
  - Each radio button is uniquely identified and controls are grouped by the question's ID.
- **Error Message**: Conditionally displayed if an error exists, associated with the question.
- **Additional Information**: Optionally includes additional text or instructions related to the question, rendered using `RichTextWithLinks`.

## Logic

The core functionality of the `RadioQuestion` component revolves around handling user interactions and displaying the form elements based on the props provided. Key aspects of its logic include:

- **Unique ID Generation**: Utilizes `getUniqueIds` to create unique accessibility-friendly identifiers for elements within the component.
- **Radio Button Interaction**:
  - Each radio button is equipped with an `onChange` handler that captures the selected option and triggers a callback function. This handler constructs the answer object and optionally includes actions to be taken on selection.
- **Accessibility Handling**:
  - The `fieldset` uses `aria` attributes to enhance accessibility, including `aria-labelledby` for linking the label and additional info, `aria-invalid` to indicate the presence of an error, and `aria-errormessage` to link to the error message element.
- **Conditional Styling**:
  - The `classNames` function is used to conditionally apply styles to radio buttons based on the presence of an error, enhancing visual feedback for users.
- **Memoization**:
  - The component is wrapped with `memo` to prevent unnecessary re-renders, optimizing performance especially in forms with complex structures or large datasets.