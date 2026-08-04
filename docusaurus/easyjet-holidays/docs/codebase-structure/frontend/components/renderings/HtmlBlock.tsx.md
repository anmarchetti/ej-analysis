### Imports

The code begins by importing necessary modules and types:

- `React`: The base React library is imported to enable JSX syntax and component creation.
- `inject`: A function from `mobx-react` used for injecting stores into React components.
- `TStores`: A type representing the structure of the MobX stores.
- `ISitecoreComponent`: An interface defining the structure for a generic Sitecore component.
- `ISitecoreField`: An interface to type the fields coming from Sitecore.

These imports are crucial for the functioning of the `HtmlBlock` component, allowing it to interact with global state management and render based on the data provided by Sitecore.

### Structure

The component is defined using several TypeScript interfaces to ensure type safety and clarity:

- `IHtmlBlockSitecoreFields`: Defines the expected structure of Sitecore fields specific to the `HtmlBlock` component. It includes a single field `Html`.
- `IHtmlBlockSitecoreParams`: Specifies the parameters that the `HtmlBlock` can accept, including `Destinations`, `Locations`, and `Query`.
- `IHtmlBlockProps`: Extends `ISitecoreComponent` by including additional props specific to the `HtmlBlock` such as `className`, `fullUrl`, `locations`, and optionally `selectedDestinationCodes`.

The `HtmlBlock` class itself extends `React.Component`, utilizing the defined interfaces to manage props. It includes methods for string comparison and determining the visibility of the HTML block based on the props and the given conditions.

### Logic

The component logic is encapsulated mainly within two methods and a getter:

- `replaceSpecificChars`: A utility method to format strings by converting them to lowercase and replacing hyphens with empty spaces.
- `compareStrings`: Compares two strings for equality after processing them with `replaceSpecificChars`.
- `shouldShow`: A getter that determines whether the `HtmlBlock` should be rendered. It uses the component's props to check against various conditions like matching locations, destinations, and query parameters.

The `render` method uses `shouldShow` to decide if the HTML content should be rendered. If true, it dangerously sets the inner HTML of a `div` to the value of the `Html` field from the Sitecore data.

Finally, the `HtmlBlock` component is connected to MobX stores using the `inject` function. This function maps parts of the stores (`layoutStore` and `searchStore`) to props (`locations`, `selectedDestinationCodes`, and `fullUrl`), thus connecting the React component to the global state.

This structure and logic ensure that the `HtmlBlock` component is a reusable, maintainable, and testable piece of the application, adhering to modern React development practices with MobX state management.