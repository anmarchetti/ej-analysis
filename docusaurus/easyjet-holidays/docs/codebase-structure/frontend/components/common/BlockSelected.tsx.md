### Imports

The `BlockSelected` component utilizes several imports:

- **React**: The base library from which the component is built, allowing the use of JSX and other React features.
- **Text**: A Sitecore JSS component used to render text fields from Sitecore in a React application.
- **classNames**: A utility function used for conditionally joining class names together.
- **useStore**: A custom hook from the application that is used to retrieve specific stores (state containers) for managing application state.
- **TStores**: A TypeScript type representing the structure of the stores used in the application.
- **SitecoreDictionary**: An enumeration defining keys for Sitecore dictionary items, ensuring that keys are used consistently and are typo-free.
- **ISitecoreField**: A TypeScript interface that defines the structure of a typical Sitecore field object.
- **SvgTick**: A React component that renders a 'tick' SVG icon.

### Structure

The `BlockSelected` component is defined as a functional component in React and uses TypeScript for type safety. The component accepts props defined by the `IBlockSelectedProps` interface:

- **className** (optional): A string to apply CSS classes to the component.
- **customSvg** (optional): A React element that allows the injection of a custom SVG.
- **dataTid** (optional): A string used for testing purposes, typically to provide a data-testid attribute.
- **siteCoreKey** (optional): A key from the `SitecoreDictionary` enumeration to fetch a phrase from Sitecore.
- **sitecoreField** (optional): An object conforming to the `ISitecoreField` interface, representing a text field from Sitecore.

The component's JSX returns a `div` element that conditionally renders based on the presence of `sitecoreField` or `siteCoreKey`. It also conditionally displays an SVG, either a custom one passed via props or a default `SvgTick`.

### Logic

1. **Store Hook**: The `useStore` hook is used at the beginning of the component to extract the `getPhrase` method from the `layoutStore`. This method is likely used to retrieve localized text based on a key from the Sitecore CMS.

2. **Conditional Rendering**: The component first checks if neither `siteCoreKey` nor `sitecoreField` are provided. If both are absent, the component renders `null`, effectively rendering nothing.

3. **Dynamic Class Names**: The `classNames` utility is used to dynamically construct the class name for the `div` element, combining the `className` prop with a default class `block-selected`.

4. **Content Rendering**:
   - **Sitecore Field**: If `sitecoreField` is provided, the `Text` component from `@sitecore-jss/sitecore-jss-nextjs` is used to render the field's value.
   - **Sitecore Phrase**: If `siteCoreKey` is provided, the `getPhrase` method is used to fetch and display a phrase based on the key.
   - **SVG Display**: The SVG to display is determined by the presence of `customSvg`. If `customSvg` is not provided, the default `SvgTick` is rendered.

This structure and logic allow the `BlockSelected` component to be a reusable and flexible part of the UI, capable of displaying text and icons based on props, which can be sourced from Sitecore or passed directly.