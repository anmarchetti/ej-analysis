## Imports

The code imports several modules and components which are essential for the functionality of the `LuxuryImageCarousel` component. Below is a breakdown of these imports:

- `FC` from `react`: Importing the `FC` type (Functional Component) from React for typing the component.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: An enumeration that likely contains keys for translating strings.
- `IComponentWithDictionary` from `models/sitecore/generic/IComponentWithDictionary`: An interface that suggests the component expects props related to a Sitecore dictionary for localization.
- `JSSImageNext` from `frontend/components/common/JSSImageNext/JSSImageNext`: A React component for rendering images, potentially optimized for Sitecore JSS projects using Next.js.
- `PromoBadge` from `frontend/components/common/PromoBadge`: A React component for displaying promotional badges.
- `Expand` from `frontend/components/icons-new/Expand`: A React component representing an expand icon.
- `styles` from `./LuxuryImageCarousel.module.scss`: Module CSS for styling the `LuxuryImageCarousel` component.

## Structure

The `LuxuryImageCarousel` component is structured as follows:

- **Props Interface (`INewHotelCarouselProps`)**: Defines the properties that the component expects:
  - `imageSrc`: URL of the image to display.
  - `onExpand`: Function to call when the expand button is clicked.
  - `renderCard`: JSX element representing a card component.
  - `renderSocialProofing`: Function that returns a JSX element based on the luxury status.
  - `children`: Optional React nodes for additional content.
  - `onPlayVideo`: Optional function to call when a play button is clicked.
  - `promoText`: Optional text for the promotional badge.

- **Component Definition**: The component is defined as a functional component using React's FC type, accepting `INewHotelCarouselProps` as props.

- **JSX Structure**: The main JSX structure consists of several nested `div` elements, each serving specific layout and functional purposes:
  - An image wrapper with two `JSSImageNext` components for displaying blurred and main images.
  - A content section that includes buttons for expanding and optionally playing a video, social proofing, a promotional badge, and a card component.
  - A carousel wrapper that contains additional children components passed to the `LuxuryImageCarousel`.

## Logic

The component's logic is primarily focused on layout and conditional rendering:

- **Image Rendering**: Two images are rendered using the `JSSImageNext` component, one with a blur effect and the other as the main image, both using the same `imageSrc`.
- **Expand and Play Buttons**: There are conditional renderings for the expand and play buttons. The expand button is always rendered, but its label changes based on whether the `onPlayVideo` function is provided. If `onPlayVideo` is available, a play button with a specific label and icon is also rendered.
- **Social Proofing and Promo Badge**: The component calls `renderSocialProofing` with a hardcoded `true` value, suggesting it always assumes a luxury context. The `PromoBadge` is conditionally rendered based on the presence of `promoText`.
- **Dynamic Class Application**: Uses the `classNames` utility to dynamically apply classes to the button wrapper, adjusting styles based on whether the play button is present.

This component is designed to be versatile within a Sitecore JSS project, leveraging localization and modular design for reusable functionality.