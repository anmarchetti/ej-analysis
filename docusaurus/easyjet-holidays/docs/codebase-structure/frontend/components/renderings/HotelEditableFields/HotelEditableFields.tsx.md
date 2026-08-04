### Imports

The component imports several modules and resources:

- `React` from the `react` package, which is the core library for building React components.
- `{ Text }` from `@sitecore-jss/sitecore-jss-nextjs`, used for rendering text fields from Sitecore in a way that supports inline editing capabilities.
- `useStore` from `frontend/hooks/useStore`, a custom hook probably used for accessing the React context or Redux store in a more convenient way.
- `{ IHotelInfoFields }` from `models/data/IHotelInfoFields`, which is an interface used to type-check the data structure containing hotel information fields.

### Structure

The `HotelEditableFields` component is a functional React component that utilizes hooks for managing state and effects. The component structure includes:

- A call to `useStore` to extract `isEditMode` and `pageFields` from the store. `isEditMode` is a boolean indicating if the app is in edit mode, and `pageFields` is expected to be an object or null, conforming to the `IHotelInfoFields` interface.
- A conditional rendering block that returns `null` if `pageFields` is not available or if the app is not in edit mode, indicating nothing should be rendered under these conditions.
- A JSX return block that renders a `div` element with multiple conditional paragraphs, each displaying a field from `pageFields` if it exists.

### Logic

The component's logic revolves around the following key functionalities:

1. **State Consumption**: Using the `useStore` hook, the component subscribes to parts of the application's state, specifically checking if it's in edit mode and retrieving page-specific fields related to a hotel.

2. **Conditional Rendering**: The component decides to render content based on the availability of `pageFields` and whether the application is in edit mode. This ensures that the editable fields are only shown when necessary and appropriate data is available.

3. **Data Presentation**: For each available field in `pageFields`, a paragraph (`<p>`) is rendered. Within each paragraph, the `Text` component from Sitecore JSS is used. This component is designed to handle editable inline text in a Sitecore-managed application. The `Text` component is passed the specific field data and a `tag` prop which dictates the HTML element (`span`) to wrap the text, allowing for proper styling and structure in the context of the document.

4. **Styling**: The outer `div` includes a class name `editable-fields wrapper-container--px`, which suggests that styles are applied for padding and layout through CSS classes, helping maintain consistent styling across the application.

This component effectively demonstrates how to integrate Sitecore JSS editable fields within a React application, focusing on usability in edit mode and adhering to clean separation of concerns and modular design principles.