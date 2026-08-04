## Imports

The `MapCardSkeleton` component uses several imports:

- `FC` from `react`: Importing `FC` (Functional Component) from React for typing the component.
- `classNames` from `classnames`: A utility function to conditionally join classNames together.
- `SvgCross` from `'frontend/components/icons-new/Cross'`: A React component that renders a cross icon, used here for the close button.
- `styles` from `'./MapCard.module.scss'`: Module CSS for styling the `MapCardSkeleton` component, ensuring that styles do not bleed into other components.

## Structure

The `MapCardSkeleton` component is structured as follows:

- **Root Div (`styles.skeleton`)**: Serves as the container for the skeleton loader of the map card.
- **Header Div (`styles.head`)**:
  - Contains a shimmer line (`styles.line` with additional class `placeholder-shimmer`) representing a loading state for the title or similar text.
  - A button that uses the `SvgCross` component for closing the skeleton card. The `onClose` function is triggered on clicking this button.
- **Content Div (`styles.content`)**:
  - **Thumbnail Div (`styles.thumbnail`)**: A div styled to represent a loading image or media content, decorated with a shimmer effect (`placeholder-shimmer`).
  - **Lines Div (`styles.lines`)**: Contains three additional shimmer lines, simulating text content in a loading state.

## Logic

The `MapCardSkeleton` component is a functional component that accepts `IMapCardSkeletonProps` as props, which includes:

- `onClose`: A function that gets called when the close button is clicked. This function is intended to handle the closure of the skeleton component, likely removing it from view or ceasing its rendering.

The component is purely presentational and designed to provide a visual placeholder while the actual content of a `MapCard` is being loaded. It uses CSS classes combined with the `classNames` utility to apply shimmer effects, indicating that the content is in a loading state. The inclusion of an interactive element (close button) allows users to interact with the component even during the loading phase, providing a better user experience by not making them wait for an action until the content has fully loaded.