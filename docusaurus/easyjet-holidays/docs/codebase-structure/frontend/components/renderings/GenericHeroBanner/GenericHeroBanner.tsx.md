## Imports

The `HeroBanner` component imports various modules and components to function properly:

- **React and MobX**: Uses `React` for component creation and state management, and `mobx-react` for making the component reactive.
- **Utility Functions and Hooks**: Imports `useStore` for accessing MobX store hooks, `getTextFromHtml` and `buildSitecoreLinkFullUrl` for string and URL manipulation.
- **Type Definitions**: Imports TypeScript interfaces and types such as `IHeroBannerFields` from the models to ensure type safety.
- **Components**: Uses `CreditAnchor`, `HeroBannerContent`, and `HeroBannerImages` as subcomponents within the hero banner.
- **Styling**: Includes SCSS module `styles` from `GenericHeroBanner.module.scss` for CSS module styling.
- **Enums and Constants**: Utilizes enums like `GenericHeroBannerVariant` for predefined variants and constants such as `CREDIT_FREE_VARIANTS` for specific business logic checks.
- **Class Name Utilities**: `classNames` is used to conditionally apply CSS classes based on component state or props.

## Structure

The `HeroBanner` component is structured as follows:

- **Interface Definitions**: Two interfaces, `IHeroBannerParams` and `IHeroBannerProps`, define the props structure the component expects.
- **Functional Component Definition**: `HeroBanner` is a functional component utilizing React hooks for managing state and effects.
- **Conditional Rendering**: Early return of `null` if the `fields` prop is not present, preventing further execution or rendering.
- **Component Logic**: Includes handling of click events, experiment data processing, and conditional class name application based on various conditions like variant and brightness.
- **Subcomponent Usage**: Renders `HeroBannerImages`, `HeroBannerContent`, and optionally `CreditAnchor` and `HeroBannerPromo` based on conditions derived from the props and experiment data.
- **Accessibility and Interaction**: Implements an invisible button to handle clicks on the entire component area for tracking purposes.

## Logic

The component's logic can be broken down into several key areas:

- **Store Hook**: Uses the `useStore` custom hook to pull necessary data from MobX stores, such as paths, experiments, and tracking functions.
- **Experiment Handling**: Checks for experiments related to the hero banner using the unique identifier from the `rendering` prop.
- **Click Handlers**: Defines methods for handling clicks on the component and buttons within it. These handlers execute tracking actions and prevent event propagation as necessary.
- **Class Name Calculation**: Uses utility functions to determine the class names based on the hero banner's variant, brightness, and other props. This determines the visual presentation of the component.
- **Conditional Components and Features**: Depending on the variant, the hero banner may display credits or different layouts. This is controlled by checking against predefined variants and using results from utility functions.
- **Event Tracking**: When actions occur (like clicks), the component logs these events using the provided tracking store methods, which includes details like event type, location, and associated metadata.

This component is a complex and highly configurable piece of the UI, designed to be flexible to accommodate different visual variants and functional behaviors based on the provided props and global state from MobX stores.