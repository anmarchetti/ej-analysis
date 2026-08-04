### Imports

The `Chatbot` component imports several modules and components from different sources:

- React essentials and hooks: `FC` (Function Component type), `useEffect` from 'react'.
- Utility functions and hooks: `classNames` for dynamic class names, `useMount` for handling component mount lifecycle, `usePrevious` for accessing previous state or props.
- Sitecore and app-specific configurations and utilities: `getCMSLang`, `TLangs`, `TRedion` for language and region handling, `envPublic` for environment-specific variables, `isSitecoreCheckboxSelected` for checking Sitecore checkbox states.
- Store and models: `useStore` to access the global store and `TStores` for typing, `ISitecoreComponent`, `ISitecoreField`, `TSitecoreCheckboxValue` for Sitecore specific data handling.
- Local component scripts: `createHelpChatbotScript`, `createSalesChatbotScript` for generating chatbot scripts dynamically.
- Next.js Head component for manipulating the head of the document.

### Structure

The `Chatbot` component is structured as follows:

- **Interfaces**:
  - `IChatbotParams`: Defines the expected structure for chatbot parameters, particularly whether the chatbot is for sales.
  - `IChatbotFields`: Defines the structure for additional data fields necessary for the chatbot, like analytics global value and title.
  - `TChatbotProps`: Combines the above interfaces with the `ISitecoreComponent` generic type to form the complete props type for the component.

- **Component Definition**:
  - The `Chatbot` component is a functional component typed with `TChatbotProps`.
  - Utilizes custom hooks to fetch state from the store and previous props/state for comparison.
  - Conditionally renders based on the edit mode and chatbot enabled settings.

- **Hooks**:
  - `useMount`: Executes the `addChatbotCreationScript` function upon component mount if not in edit mode and if the chatbot is enabled.
  - `useEffect`: Re-executes the script addition when the current page path changes, ensuring that the chatbot updates its content and scripts appropriately based on the new context.

- **Rendering**:
  - Returns `null` if in edit mode or if the chatbot is disabled.
  - Otherwise, returns a `div` element with dynamic class names and key properties, containing either sales or help chatbot scripts and styles, managed by the `Head` component for external resources.

### Logic

- **Chatbot Script Injection**:
  - The `addChatbotCreationScript` function dynamically creates and appends a script element to the chatbot div. This script is either for sales or help based on the `IsSalesChatbot` parameter.
  - Scripts are created using helper functions `createSalesChatbotScript` or `createHelpChatbotScript`, which format the scripts with necessary parameters like language, region, and titles.
  
- **Chatbot Enablement and Mode Checks**:
  - The chatbot checks if it's enabled through a setting from the store and also verifies if it's not in the edit mode to proceed with rendering and script injections.
  - It uses previous values of the page path and hotel details book page flag to determine if the chatbot needs to update its scripts when navigating between different hotel detail pages.

- **Dynamic Styling and Script Loading**:
  - Depending on the type of chatbot (sales or help), different styles and scripts are loaded using the `Head` component.
  - Inline styles are set using `dangerouslySetInnerHTML` for specific styling of the chatbot interface components.