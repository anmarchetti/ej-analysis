### Imports

The `AmendBoardSkeleton` component imports several modules and components:

- `React`: The base library from the React framework, necessary for defining the component and using JSX.
- `classNames`: A utility function to conditionally join class names together. It is used here to handle dynamic class names.
- `BoardCardSkeleton`: A React component imported from `frontend/components/common/BoardCardSkeleton/BoardCardSkeleton`. This component is used to display a loading skeleton for board cards.
- `styles`: Specific SCSS module for styling, imported from `./AmendBoardSkeleton.module.scss`. This module provides CSS class names bound to the local scope of the component.

### Structure

The `AmendBoardSkeleton` is a functional component structured as follows:

- **Container (`div`)**: The top-level element with a class from the imported `styles` object (`styles.container`). It also includes a `data-tid` attribute for possible use in testing.
- **Two Instances of `BoardCardSkeleton`**: These components represent placeholders for content that is loading. They receive props spread from the `skeletonProps` object.
- **Divider (`div`)**: A `div` element placed between the two `BoardCardSkeleton` components, using both a generic `placeholder-shimmer` class and a specific class from `styles.roomsDivider` to style the divider.

### Logic

The component encapsulates the logic primarily through the `skeletonProps` object, which holds properties passed to the `BoardCardSkeleton` components:

- `bodyClassName`: A class name sourced from `styles.body` to style the body of the card skeleton.
- `className`: A class name sourced from `styles.card` to style the card skeleton itself.
- `linesAmount`: A numerical value indicating the number of lines the skeleton should display, set here to `2`.

These properties are spread into each `BoardCardSkeleton` component, ensuring both instances have the same visual structure and behavior. The use of `classNames` for the divider allows combining a general-purpose shimmer effect with specific styling dictated by the module's SCSS.