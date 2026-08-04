### Imports

The component imports several libraries and modules to facilitate its functionality:

- **React and Hooks**: Uses `React`, `useCallback`, and `useEffect` for managing component lifecycle and state.
- **Classnames**: Utilizes the `classnames` library for conditional class assignment.
- **MobX**: Integrates `observer` and `useLocalObservable` from `mobx-react-lite` for state management within MobX stores.
- **Sanitize-html**: Employs the `sanitize-html` library to clean HTML content and prevent XSS attacks.
- **Custom Hooks and Utilities**:
  - `useXSMobileViewport`: A custom hook to check if the viewport matches a mobile view.
  - `useStore`: Custom hook for accessing MobX stores.
  - `getLocationHierarchy`, `isBackend`, `addressStringToTitleCase`: Utility functions for location data processing, backend check, and string formatting.
- **Sitecore and Models**:
  - `SitecoreDictionary`: Enum for dictionary keys used in Sitecore implementations.
- **Components**:
  - `Button`, `JSSResponsiveImage`, `ReadMoreButton`: Reusable UI components.
  - `IconChevronDown`, `IconChevronUp`, `IconMapMarker`: Icon components used within buttons and other UI elements.
- **Styles**:
  - `styles`: Module CSS for styling the component, imported from `ResortInfoBlock.module.scss`.

### Structure

The `ResortInfoBlock` component is structured as follows:

- **State Management**:
  - Utilizes `useState` for managing loading states.
  - `useLocalObservable` to handle local mutable states like the toggling of read more/less in the description and map visibility.
- **Store Integration**:
  - Extracts data and functions from various stores using the `useStore` hook, which provides access to phrases, resort information, and UI state toggles.
- **Responsive Handling**:
  - Checks for mobile viewport size to adjust UI elements and functionality, specifically for map display.
- **Effect Hooks**:
  - Two `useEffect` hooks manage the fetching of resort information based on dependency changes and parse the resort description when the data is available.
- **Callback Hooks**:
  - Several `useCallback` hooks handle UI interactions such as toggling the read more/less state, and map visibility on desktop and mobile.

### Logic

- **Data Fetching**:
  - The component decides whether to fetch resort information based on the browsing context (details page or offer selection).
  - Resort information is fetched asynchronously, and loading states are managed accordingly.
- **Description Parsing**:
  - The resort description is split and parsed to manage the length of visible text. If the description exceeds a preset length, it provides a "Read More" option.
- **Dynamic UI Elements**:
  - The map button's visibility and text are dynamically adjusted based on whether the map is currently shown and if the viewport is extra small (mobile).
  - Address display is formatted and conditional based on the available data.
- **Sanitization**:
  - All dynamically loaded HTML content (like descriptions) is sanitized to prevent XSS attacks, using a predefined set of allowed HTML tags.
- **Conditional Rendering**:
  - The component conditionally renders various sections based on data availability, loading states, and whether it is being accessed from the backend.
- **Token Replacement**:
  - Uses a tokenizer to replace tokens in phrases fetched from Sitecore, enhancing the dynamic text display based on the context (like resort names).

This documentation outlines the primary aspects of the `ResortInfoBlock` component, focusing on its dependencies, structural composition, and logical flow within a React application integrated with MobX and Sitecore.