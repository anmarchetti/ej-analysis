## Imports

The component imports several modules and assets to function properly:

- **React and FC (Function Component)**: Imports React and its Function Component type (FC) for creating functional components.
- **classNames**: A utility function to conditionally join class names together.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing the Redux store state.
- **MediaSize**: An enumeration from `models/data/MediaSizeParams` that defines different media sizes.
- **SitecoreDictionary**: An enumeration from `models/enum/SitecoreDictionary` providing constants for dictionary keys in Sitecore.
- **JSSImageNext**: A component from `frontend/components/common/JSSImageNext/JSSImageNext` tailored for optimized image rendering.
- **TLanguageSelectorOption**: A TypeScript type from `frontend/components/renderings/LanguageSelector/interfaces` defining the structure for language selector options.
- **styles**: Specific module CSS imported from `./LanguageSelectorButton.module.scss` to style the component.

## Structure

The `LanguageSelectorButton` is a React functional component utilizing TypeScript for type safety. It accepts props defined by the `ILanguageSelectorButtonProps` interface, which extends partial `React.AriaAttributes` for accessibility attributes (`aria-expanded` and `aria-haspopup`) and includes:

- **langOption**: An optional object of type `TLanguageSelectorOption` containing information about the language option.
- **onClick**: A function to handle click events on the button.

The component structure is straightforward, consisting of a single `button` element that optionally displays an image (using the `JSSImageNext` component) based on the `langOption` provided.

## Logic

The component's logic revolves around handling language selection and accessibility:

1. **Store Hook**: It uses the `useStore` hook to access `layoutStore.getPhrase`, a method for retrieving phrases for localization.
2. **Icon Retrieval**: It attempts to determine the correct icon to display by checking `IconCircle` and `Icon` fields from `langOption`.
3. **Image Source Calculation**: Determines the source of the icon by checking `IconCircle` first, then `Icon`, and uses whichever is available.
4. **Rendering**: The button renders with dynamic class names from `styles.button`. If an icon source is available, it renders the `JSSImageNext` component with the respective icon field, specifying `fill` and `mediaSize` as `Small`, and sets it to load with priority.
5. **Accessibility**: The button is labeled using a phrase fetched from the Sitecore dictionary (`SitecoreDictionary.GlobalsLabelsChooseLanguage`), and it spreads any additional `aria-*` attributes provided via props to ensure the component meets accessibility standards.

The onClick handler provided via props is attached to the button to manage user interactions, specifically for changing the language when the button is clicked.