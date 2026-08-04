## Imports

The `EntryQuizTab` component relies on several imports from various modules:

- **React and third-party libraries**:
  - `FC` from `react`: Importing React's Function Component type for TypeScript.
  - `classNames` from `classnames`: A utility to conditionally join class names together.

- **Custom hooks and utilities**:
  - `useMobileViewport` from `frontend/hooks/useMediaQuery`: A hook to check if the current viewport matches mobile screen sizes.
  - `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the global state store.
  - `getQuizEventsCoreParamsOverride` and `generateGenericValues` from `frontend/utils/tracking`: Utilities for handling tracking and analytics data.

- **Data models and enums**:
  - `IHolidaysStores`, `IStartQuizFields` from model directories: Interfaces defining the structure of store and quiz related data.
  - `EventTypes`, `EventActions`, `EventCategories`, `EventLabels` from `models/enum/tracking`: Enums for standardized tracking event parameters.

- **Sitecore and common components**:
  - `ISitecoreComponent` from `models/sitecore/generic`: Interface for a generic Sitecore component.
  - `Button`, `JSSImage` from `frontend/components/common`: Reusable UI components for buttons and images.
  
- **Styling**:
  - `commonStyles` from `frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss`: Shared styles for the Inspire Me Tabs component.
  - `styles` from `./EntryQuizTab.module.scss`: Specific styles for the Entry Quiz Tab component.

## Structure

The `EntryQuizTab` component is structured as follows:

- **Functional Component Definition**:
  - It is defined as a functional component using React's FC type, taking `TEntryQuizTabProps` as props, which extends `ISitecoreComponent` with the `IStartQuizFields` interface.

- **State and Store Hook Usage**:
  - The component uses the `useStore` hook to extract methods and properties from the global store, specifically related to quiz functionality (`goToNextQuestion`, `clearAnswers`, `isQuizFinishedBefore`) and event tracking (`trackEventWithParams`).

- **Conditional Rendering and Event Handling**:
  - The component conditionally renders UI elements based on whether the quiz has been finished before.
  - It handles button clicks to navigate through the quiz questions and optionally clear answers, using the `handleNextQuestionClick` method.

- **Layout and Styling**:
  - The layout includes a background image section, title, description, and control buttons.
  - Styling is applied using CSS modules, with additional class names managed by the `classNames` utility to merge styles conditionally.

## Logic

The logic of the `EntryQuizTab` component is encapsulated in several key functionalities:

- **Viewport Check**:
  - The `useMobileViewport` hook determines if the device is mobile-sized, which influences button sizing and layout.

- **Event Handling**:
  - `handleNextQuestionClick`: A method that handles the logic for moving to the next quiz question. It tracks the event, clears answers if specified, and navigates to the next question.
  - `onClickStart`, `onClickEditAnswers`, `onClickStartNew`: Wrapper methods for `handleNextQuestionClick` that specify labels and whether to clear answers based on the button clicked.

- **Tracking and Analytics**:
  - Events are tracked using `trackEventWithParams`, which is configured with specific parameters for each action within the quiz (start, edit, restart).
  - Tracking parameters are further customized using `getQuizEventsCoreParamsOverride` and `generateGenericValues` to include additional data specific to the quiz events.

The component effectively combines UI, state management, and event handling to provide interactive quiz functionality within a Sitecore-powered application, using a clean and modular React component structure.