## Imports

The `InfoOnly` component utilizes several imports from various libraries and local files:

- **React Imports:**
  - `FC` (Function Component type) and `memo` from `react` for creating a memoized functional component.
  - `useEffect` hook from `react` to handle side effects in the component lifecycle.

- **Sitecore JSS Next.js:**
  - `Text` component from `@sitecore-jss/sitecore-jss-nextjs` is used for rendering text fields from Sitecore.

- **Local Component:**
  - `RichTextWithLinks` from `frontend/components/common/RichTextWithLinks` for rendering rich text content that includes links.

- **Type Definitions and Utilities:**
  - Several types such as `IAnswerAction`, `IQuestionProps`, `PopupType`, and `TAnswerValue` from `frontend/components/renderings/AssistedTravelForm/models/types` to ensure type safety and clarity.
  - `createOnContactUsClick` utility function from `frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils` to handle the "Contact Us" link click events.

- **Styling:**
  - SCSS module `styles` from `./InfoOnly.module.scss` to apply CSS modules styling specific to the `InfoOnly` component.

## Structure

The `InfoOnly` component is defined as a functional component using TypeScript. It accepts props of type `TInfoOnlyProps` which include:

- `onChange`: A function to handle changes. It expects an array of `TAnswerValue` and an optional `IAnswerAction`.
- `question`: An object containing details about the question such as `id`, `label`, and `description`.
- `togglePopup`: A function to handle toggling of popups of type `PopupType` or null.

The component structure includes:

- A `useEffect` hook that processes the first option of the question if available and triggers the `onChange` function with the necessary data.
- A rendering block that displays the question label using the `Text` component and the question description using the `RichTextWithLinks` component. The `RichTextWithLinks` also handles link clicks using `onContactUsClick`.

## Logic

1. **Initialization and Side Effects:**
   - On component mount, the `useEffect` hook is executed once (`[]` as the dependency array). It checks if there is at least one option available in the `question.options` array.
   - If an option exists, it destructures necessary fields from the option and invokes the `onChange` callback with the structured data.

2. **Handling Link Clicks:**
   - The `createOnContactUsClick` function is called with `togglePopup` as an argument to generate a handler for "Contact Us" link clicks. This handler will be used in the `RichTextWithLinks` component.

3. **Rendering:**
   - The component renders a `div` with a class from the imported SCSS module.
   - Inside the div, it uses the `Text` component to display the question label and conditionally renders the `RichTextWithLinks` component if a `description` is provided in the `question` object. The `RichTextWithLinks` component is responsible for rendering potentially rich text content and handling link interactions.

This component effectively handles the display of informational content and ensures that any initial answers are captured and handled appropriately when the component mounts.