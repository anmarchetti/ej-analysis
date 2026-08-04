## Imports

The `QuestionFooter` component utilizes several imports from various libraries and local modules:

- **React and FC (Functional Component)**: Importing React for building the component and FC for typing the component as a functional component.
- **classnames**: A utility to conditionally join classNames together.
- **observer from mobx-react**: Used to make the React component reactive to MobX store changes.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing MobX stores.
- **IHolidaysStores**: Interface from `frontend/store/holidays` defining the shape of the holiday stores used in the component.
- **SitecoreDictionary**: Enum from `models/enum/SitecoreDictionary` for accessing dictionary keys.
- **Button**: A common button component from `frontend/components/common/Button`.
- **styles**: Module CSS imported from `frontend/components/common/InspireMeQuestionFooter/QuestionFooter.module.scss` for styling.
- **IconChevronLeft**: A React component representing a left chevron icon, from `frontend/components/icons-new/ChevronLeft`.

## Structure

The `QuestionFooter` component is structured as follows:

- **Props Interface (`IQuestionFooterProps`)**: Defines the properties that the `QuestionFooter` component can accept.
- **Functional Component Definition**: Uses destructuring to extract properties directly in the parameter list for readability and ease of use.
- **Internal State and Effects**: Utilizes `useStore` to derive state from the MobX stores, particularly focusing on phrases for button texts and loading states for buttons.
- **JSX Structure**:
  - A top-level `<div>` with a specific class for positioning.
  - Conditional rendering of `children` content.
  - Another `<div>` containing two `Button` components for "back" and "next" functionalities, each button is styled and can be disabled or shown as loading based on the component's props and state derived from stores.

## Logic

The component's logic primarily revolves around button functionalities and state management:

- **Store Connections**: Using `useStore`, the component subscribes to parts of the MobX stores (`layoutStore` and `inspireMeStore`) to manage phrases for button texts and the loading states of the buttons.
- **Button Texts**: Default texts for the buttons are fetched using `getPhrase` method from `layoutStore` with keys from `SitecoreDictionary`, unless overridden by props.
- **Button States**: Buttons can be disabled or shown as loading based on the props `isBackButtonDisabled`, `isNextButtonDisabled` and states `isPrevButtonLoading`, `isNextButtonLoading` derived from the `inspireMeStore`.
- **Event Handlers**: `onBackClick` and `onNextClick` are called when the respective buttons are clicked, allowing parent components to define custom behaviors for these actions.

The component is wrapped with `observer` from MobX, making it reactive to changes in the MobX state used within the component, thus re-rendering when necessary based on store changes.