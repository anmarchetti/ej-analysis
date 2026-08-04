## Imports

The `LanguageSelector` component imports several modules and dependencies necessary for its operation:

- **React Essentials**: Utilizes `React`, `FC` (Function Component type from TypeScript for type-checking), and `useState` for managing component state.
- **React DOM**: Imports `createPortal` for rendering components outside the DOM hierarchy.
- **MobX**: Uses `observer` from `mobx-react` to enable the component to react to changes in the application state.
- **Custom Hooks and Utilities**:
  - `useStore`: A custom hook for accessing MobX stores.
  - `isBackend`: A utility function to determine if the code is running on a server.
- **Type Definitions**:
  - `ISitecoreField`: A type definition for fields managed in Sitecore.
  - `TLanguageSelectorOption`: A type definition specific to language selector options.
- **Subcomponents**:
  - `LanguageSelectorButton`: A component representing the button to trigger the language selector.
  - `LanguageSelectorPopup`: A component representing the popup that appears when the language selector is activated.

## Structure

### Component Definition

- **`ILanguageSelectorFields` Interface**: Defines the shape of the props related to the fields needed by the component which includes an array of language options and titles for the popup.
- **`ILanguageSelectorProps` Interface**: Defines the props structure for the `LanguageSelector` component, which includes `ILanguageSelectorFields`.

### Functional Component

`LanguageSelector` is a functional component utilizing React hooks for state management and effects. It is wrapped with `observer` from MobX, making it reactive to changes in the application's state.

### Return Structure

The component conditionally renders based on the availability of language options:
- **Language Selector Button**: Always rendered if there are language options available.
- **Language Selector Popup**: Rendered using `createPortal` to attach it directly to the `body` of the document, which helps in managing CSS stacking contexts (`z-index` issues). It is only rendered if there are multiple language options and is controlled by a state variable that tracks its visibility.

## Logic

### State Management

- `isLanguageSelectorPopupShown`: A boolean state that determines the visibility of the language selector popup.

### Computed Properties

- `items`: Filters the incoming `fields.Items` to include only those with a valid `Code` value.
- `activeLangOption`: Determines the currently active language option based on `siteLang` from the store.
- `hasPopup`: Boolean indicating if the popup should be available, based on the count of valid language options.

### Event Handlers

- **`onLangButtonClick`**: Toggles the visibility of the language selector popup.
- **`closePopup`**: Sets the popup's visibility to false, effectively closing it.

### Conditional Rendering

The component returns `null` if there are no valid language items, thus not rendering anything in such cases. Additionally, the popup is only rendered if there are multiple languages to choose from, and the rendering outside the normal DOM flow is handled through `createPortal` to `document.body` for better UI handling.