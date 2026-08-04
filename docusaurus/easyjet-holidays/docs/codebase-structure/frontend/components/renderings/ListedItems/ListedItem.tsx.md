### Imports

The `ListedItem` component uses several imports:

- `FC` from `react` is imported for defining functional components with TypeScript.
- `classNames` is a utility function from the `classnames` package, used for dynamically setting CSS class names.
- `MediaSize` is imported from `models/data/MediaSizeParams`, likely a set of predefined sizes for media elements.
- `JSSImageNext` is a component imported from `frontend/components/common/JSSImageNext/JSSImageNext`, presumably a customized image component that supports advanced features like lazy loading.
- `styles` from `./Listeditems.module.scss` imports specific SCSS module styles for styling the component.

### Structure

The `ListedItem` component is defined as a functional component using TypeScript. It accepts `IListedItemProps` as props, which may include:

- `className` (optional): A string for CSS class names.
- `icon` (optional): An object containing `alt` (alternative text) and `src` (source URL) for an image.
- `text` (optional): A string of text to display.

The component also defines a constant `ICON_SIZE` set to `24`, which is used to specify the width and height of the icon.

The component's JSX structure consists of a `<li>` element that conditionally renders:

- An `JSSImageNext` component for the icon if `src` is provided.
- A `<p>` element for the text if `text` is provided.

### Logic

The component first checks if neither `icon` nor `text` is provided. If both are missing, it returns `null`, effectively rendering nothing.

If an `icon` object is present but lacks an `alt` property, the `alt` property is defaulted to the value of `text`. This ensures that the image has an alternative text, enhancing accessibility.

The `classNames` function combines `styles.item` with any `className` passed to the component, allowing for both default and custom stylings.

The component uses the `JSSImageNext` for rendering the icon, passing relevant props such as `field`, `mediaSize`, `width`, `height`, and a `data-tid` attribute for testing or targeting the element in the DOM.

Each rendered element (icon and text) is given a `data-tid` attribute, formatted with the `alt` text and a suffix (`_icon` or `_text`), aiding in testing and debugging.