### Imports

The `BoardCardSkeleton` component imports several modules and libraries necessary for its functionality:

- `FC` from `react`: Used to define the functional component type from React.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `boardCardStyles` from `'frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard.module.scss'`: Specific styles imported from a SCSS module for the BoardCard component.
- `styles` from `'./BoardCardSkeleton.module.scss'`: Styles specific to the `BoardCardSkeleton` component, defined in a local SCSS module.

### Structure

The `BoardCardSkeleton` component is structured as follows:

- **Props Interface (`IBoardCardSkeletonProps`)**: Defines the properties that can be passed to the `BoardCardSkeleton` component. These include optional properties like `bodyClassName`, `className`, `height`, `isSelected`, `isSpoiler`, `linesAmount`, and `titleClassName`.
  
- **Default Constants**: 
  - `DEFAULT_LINES_AMOUNT`: A constant set to `1`, used to define the default number of content lines if not specified in the props.

- **Functional Component Definition (`BoardCardSkeleton`)**:
  - The component uses destructuring to extract and set default values for props.
  - It generates content lines with shimmer effects to simulate loading content, using the `classNames` function to conditionally apply styles.

- **JSX Structure**:
  - The component returns a structured JSX layout which includes a container div and nested elements that represent different parts of the skeleton loader, such as title, content, and a button placeholder.

### Logic

The logic of the `BoardCardSkeleton` component revolves around rendering a skeleton screen placeholder for content that is yet to be loaded, typically used while waiting for data fetching to complete:

- **Conditional Styling**:
  - Uses the `classNames` utility to dynamically assign classes based on the component's props (`isSelected`, `isSpoiler`), which affects the visual representation of the skeleton (e.g., different styling if the card is selected or is a spoiler).
  
- **Dynamic Height**:
  - Allows for a dynamic `height` style to be applied to the skeleton container if the `height` prop is provided.

- **Content Lines Generation**:
  - Pre-defines a set of shimmer effect lines (`contentLines` array) which simulate text content.
  - The number of lines rendered is controlled by the `linesAmount` prop, with a slice of the `contentLines` array rendered based on this prop.

- **Accessibility and Testability**:
  - Includes `data-tid` attributes throughout the JSX to facilitate testing, ensuring that each significant part of the skeleton can be easily targeted in test scripts.