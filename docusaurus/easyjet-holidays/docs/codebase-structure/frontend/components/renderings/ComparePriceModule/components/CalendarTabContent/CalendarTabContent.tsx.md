## Imports

The code imports various modules, components, hooks, types, and styles necessary for the `CalendarTabContent` component to function:

- **React and Classnames**: Standard imports for React components (`FC`, `ReactElement`) and utility functions (`classnames` for conditional class names).
- **Hooks and Store**: Custom hook `useStore` to access Redux store and type `TStores` for typing the store.
- **Models and Enums**: Imports related to the data models (`IComponentWithDictionary`) and enums (`SitecoreDictionary`) used for type definitions and dictionary references.
- **Components**: Various icon components (`IconCalendarLined`, `IconChild`, etc.), `Weekdays`, `ComparePriceCalendar`, and `ComparePriceModuleToggle` components for displaying specific UI elements.
- **Styles**: SCSS module for styling (`ComparePriceContent.module.scss`) specific to the `CalendarTabContent` component.

## Structure

The component file defines two main React components:

1. **`CalendarTabTitle`**:
   - Functional component that uses the `useStore` hook to fetch a phrase from the store using the `getPhrase` function.
   - Renders a title wrapper containing an icon and a text span that displays the fetched phrase.

2. **`CalendarTabContent`**:
   - Functional component accepting several props defined by the `ICalendarTabContentProps` interface.
   - Structured into several visual parts:
     - Header displaying the duration of a holiday.
     - Conditional rendering of the tourist tax component based on the `isMobileView` prop.
     - A legend section showing icons and labels for promotions, changes, and free options for kids, depending on the props provided.
     - Conditionally rendered `ComparePriceModuleToggle` and `Weekdays` components based on the `isMobileView`.
     - A main calendar view section that is displayed based on the `isDisplayed` prop, which includes the `ComparePriceCalendar` component configured with various props related to dates and flags.

## Logic

The logic of the `CalendarTabContent` component revolves around conditional rendering and data handling:

- **Data Fetching and Handling**:
  - The `getPhrase` function is used to fetch localized strings from the store, which are then used within the component to display relevant text based on the site's dictionary settings.
  
- **Conditional Rendering**:
  - Various parts of the component are rendered based on the boolean props such as `isMobileView`, `isDisplayed`, `isPromoDisplayed`, `isFreeForKidsDisplayed`, and `isCheapest`.
  - This allows the component to adapt its UI based on the state of these flags, providing a dynamic user experience that adjusts to different scenarios like mobile view and promotional states.
  
- **Props Handling**:
  - The component handles a complex set of props that determine its behavior and presentation, including dates, labels, and UI states.
  - Functions and objects passed as props (`setActiveDate`, `toggleProps`) are utilized in child components for actions like changing the active date in a calendar and toggling UI elements.

Overall, the `CalendarTabContent` component is designed to be a flexible and dynamic part of a larger application, capable of displaying complex and interactive content based on a variety of data inputs and user interactions.