### Imports
The `BackToReferrer` component utilizes several imports:

- **React and FC (Functional Component)**: Imports React and `FC` (Functional Component) from the 'react' library to enable the use of functional components in the file.
- **useStore**: Custom hook from 'frontend/hooks/useStore' to access the application's state management.
- **IHolidaysStores**: Type definition for the holiday stores from 'frontend/store/holidays', ensuring type safety and autocomplete for store operations.
- **SitecoreDictionary**: Enum from 'models/enum/SitecoreDictionary' to handle dictionary values, which helps in managing static string content.
- **IconChevronLeft**: A React component from 'frontend/components/icons-new/ChevronLeft' that renders the left chevron icon.
- **buildBackLinkUrl**: A utility function from './BackToReferrer.utils' that constructs a URL for navigating back to the referrer page.

### Structure
`BackToReferrer` is a React functional component defined using TypeScript. It receives a single prop:

- **returnPath (string)**: The path to return to when the back link is clicked.

The component structure is as follows:

- **useStore Hook**: It extracts `trackBackToFlightsClick`, `getPhrase`, and `referrer` from the store using the custom `useStore` hook.
- **URL Construction**: Calls `buildBackLinkUrl` with `referrer` and `props.returnPath` to construct the URL to navigate back to.
- **Conditional Rendering**: If `backToFlightsUrl` is not available, the component returns `null`, effectively rendering nothing.
- **JSX**: If the URL is available, it renders a `div` containing an `a` tag styled as a button, which includes the `IconChevronLeft` and the text fetched using `getPhrase` with the dictionary key `GlobalsButtonsBack`.

### Logic
The component's logic revolves around the following key functionalities:

- **Store Access**: Accesses the global state store to fetch necessary data like the referrer URL and tracking functions.
- **URL Handling**: Uses the `buildBackLinkUrl` utility to determine the appropriate URL based on the referrer information and the provided return path. This ensures that the user is redirected correctly when they choose to navigate back.
- **Event Handling**: Attaches an `onClick` event to the back link, which triggers `trackBackToFlightsClick`. This function likely tracks the user's action for analytics purposes.
- **Dynamic Text**: Utilizes the `getPhrase` function to dynamically fetch the button text from a central dictionary, allowing for easy updates and localization.

Overall, the `BackToReferrer` component is designed to provide a back navigation link with dynamic capabilities, including URL construction based on referrer data, tracking user interactions, and displaying localized text.