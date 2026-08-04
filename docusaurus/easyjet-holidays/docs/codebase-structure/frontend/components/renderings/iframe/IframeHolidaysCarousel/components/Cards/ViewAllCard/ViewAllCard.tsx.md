### Imports

The `ViewAllCard` component imports several modules and dependencies:

- `React` from the 'react' library, which is essential for using React component and JSX syntax.
- `Tokens` from 'code/tokens', presumably a module containing constant values used for token replacement.
- `useStore` from 'frontend/hooks/useStore', a custom React hook likely used for accessing React context or Redux store.
- `IHolidaysStores` from 'frontend/store/holidays', an interface that defines the shape of the holiday-related data in the store.
- `Tokenizer` from 'frontend/utils/tokenizer', a utility for manipulating strings, possibly replacing placeholders with dynamic values.
- `SitecoreDictionary` from 'models/enum/SitecoreDictionary', an enumeration that provides keys for accessing specific strings, likely used for internationalization or centralized text management.
- `ViewAllCardBackground` from the current directory, a React component that is used as a background for the `ViewAllCard` component.
- `styles` from './ViewAllCard.module.scss', a module CSS file that contains styles specific to the `ViewAllCard` component.

### Structure

The `ViewAllCard` component is structured as follows:

- **Props**: The component accepts `href` as a prop, which is a string representing the URL to which the card will link.
- **State and Context**: Utilizes the `useStore` hook to extract `getPhrase` and `destination` from the store. `getPhrase` is a function presumably used to fetch localized or configured text phrases, and `destination` is a value indicating the main destination display value from the search store.
- **JSX Layout**:
  - A root `div` with a class of `card` from the imported `styles`.
  - Inside the root `div`, the `ViewAllCardBackground` component is rendered first.
  - A nested `div` with a class of `content` contains:
    - An `h3` element for the title, using a phrase fetched from `SitecoreDictionary` using `getPhrase`.
    - A `p` element for the subtitle, which includes dynamic content replaced via the `Tokenizer` utility.
  - An anchor (`a`) tag styled as a full-width button, linking to the provided `href` and opening the link in a new tab (`target='_blank'` and `rel='noreferrer'`).

### Logic

The logic of the `ViewAllCard` component revolves around displaying a promotional card with dynamic content based on the store's state:

- **Phrase Fetching**: The component fetches necessary phrases for the title, subtitle, and button text using the `getPhrase` method and keys from `SitecoreDictionary`. This approach ensures that the text can be easily managed or localized.
- **Dynamic Text Replacement**: In the subtitle, the `Tokenizer.replaceToken` method is used to dynamically insert the destination into the phrase, enhancing the personalized feel of the content.
- **Styling and Accessibility**:
  - The component uses SCSS modules for styling, which helps in maintaining styles scoped to the component without affecting other parts of the application.
  - The button is designed to truncate text if it's too long (`text-truncate`), ensuring the UI remains clean and usable regardless of content length.
  - The use of `data-tid='view-all-link'` suggests an approach for easier targeting in tests or specific styling hooks.