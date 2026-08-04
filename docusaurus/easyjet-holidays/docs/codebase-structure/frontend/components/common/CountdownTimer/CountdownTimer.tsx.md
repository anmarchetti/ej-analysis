## Imports

The `CountdownTimer` component utilizes several imports to function properly:

- **React FunctionComponent**: Imported from `react`, this is used to define the component as a functional component.
- **classnames**: A utility to conditionally join classNames together, used here to manage CSS class names dynamically.
- **Tokens**: Imported from `code/tokens`, likely a set of predefined constants representing specific values or keys.
- **Tokenizer**: A utility from `frontend/utils/tokenizer` used for replacing tokens in strings based on provided patterns and values.
- **ISitecoreField**: A TypeScript interface from `models/sitecore/generic/ISitecoreField` defining the structure for Sitecore fields expected by the component.
- **RichTextWithLinks**: A React component from `frontend/components/common/RichTextWithLinks` used to render rich text content that includes hyperlinks.
- **useCountdown**: A custom React hook defined in `./CountdownTimer.utils` used to compute countdown time values based on a provided date.
- **styles**: Specific module CSS imported from `./CountdownTimer.module.scss` to style the component.

## Structure

The `CountdownTimer` component is structured as follows:

- **ICountdownTimerProps Interface**: Defines the props expected by the `CountdownTimer` component, including:
  - `date`: A `ISitecoreField<string>` representing the target countdown date.
  - `field`: A `ISitecoreField<string>` containing the text to be displayed, potentially with tokens to be replaced dynamically.
  - `className`: An optional string for CSS class names to be applied to the component.
  
- **CountdownTimer Component**: A functional component that utilizes the `useCountdown` hook to get countdown data (`days`, `hours`, `minutes`, `seconds`) based on the `date` prop. It conditionally renders a `RichTextWithLinks` component, applying dynamic class names and replacing tokens in the `field` prop's value with actual countdown data wrapped in styled `<span>` elements.

## Logic

The core functionality of the `CountdownTimer` component revolves around the countdown mechanism and dynamic content rendering:

1. **Countdown Calculation**: The `useCountdown` hook is invoked with `date.value` (the target date). It returns an object containing `days`, `hours`, `minutes`, and `seconds` left until the target date. If there is no data (e.g., date is past), the hook might return `null`.

2. **Conditional Rendering**: The component immediately returns `null` if the `useCountdown` hook returns no data, effectively rendering nothing.

3. **Dynamic Token Replacement and Styling**:
   - The `field.value` (which might contain tokens like `[Days]`, `[Hours]`, etc.) is processed using the `Tokenizer.replaceTokens` method.
   - Tokens are replaced with corresponding values from the countdown data, each wrapped in a `<span>` with a specific CSS class for styling.
   - This processed string is then passed as the `field` prop to the `RichTextWithLinks` component.

4. **RichTextWithLinks Component**: This component handles the rendering of the processed text. It also supports additional styling through the `className` prop, which combines any custom class passed to `CountdownTimer` with the `noWrapContainer` class from the component's own SCSS module.

This structure and logic allow the `CountdownTimer` to serve as a reusable and dynamically styled countdown display component, suitable for various applications where a countdown feature is needed, particularly in projects utilizing Sitecore and rich text content.