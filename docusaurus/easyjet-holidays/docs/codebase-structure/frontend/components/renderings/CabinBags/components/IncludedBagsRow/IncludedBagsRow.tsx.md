## Imports

The component makes use of several imports:

- `React, { FC }` from 'react': This import brings in React and its Functional Component type (FC) which is used to define the component type.
- `Text` from '@sitecore-jss/sitecore-jss-nextjs': This imports the `Text` component from the Sitecore JSS library for Next.js, which is used for rendering text fields from Sitecore.
- `ICabinBagsFields` from 'models/data/ICabinBagsFields': This imports the TypeScript interface `ICabinBagsFields` which defines the structure of the props expected in the `fields` object.
- `JSSImage` from 'frontend/components/common/JSSImage': This is a custom component used to render images using Sitecore JSS.
- `styles` from './IncludedBagsRow.module.scss': This imports module-specific styles defined in the SCSS file.

## Structure

The `IncludedBagsRow` component is structured as follows:

1. **Props Definition (`IIncludedBagsRowProps`)**:
   - `fields`: An object of type `ICabinBagsFields` which should contain all the necessary fields to render the component.
   - `withInfant`: A boolean indicating whether the infant-related text should be displayed.

2. **Functional Component Definition (`IncludedBagsRow`)**:
   - The component is defined as a functional component using the arrow function syntax.
   - It accepts props of type `IIncludedBagsRowProps`.

3. **JSX Structure**:
   - The component returns a single `div` element with a class of `includedBag`.
   - Inside this `div`, there is a `span` element with a class of `extraBag` that contains:
     - An `JSSImage` component to display the included bag icon.
     - A `div` element wrapping a `Text` component from Sitecore JSS that conditionally displays text based on the `withInfant` prop.

## Logic

The component's logic revolves around conditional rendering based on the `withInfant` prop:

- **Image Rendering**:
  - The `JSSImage` component is used to render the `IncludedIcon` field. This component is styled using the `styles.icon`.

- **Conditional Text Rendering**:
  - The `Text` component is used to render text, and it conditionally displays either `SmallBagDropdownWithInfantLabel` or `SmallBagDropdownLabel` based on the `withInfant` boolean. This is determined by the ternary operator `(withInfant ? SmallBagDropdownWithInfantLabel : SmallBagDropdownLabel)`.

- **Data Attributes**:
  - `data-tid` attributes are used throughout the component for testing purposes, providing unique identifiers that can be targeted in tests.

This component effectively demonstrates how to use props, conditional rendering, and Sitecore JSS components in a practical scenario within a React functional component.