## Imports

The `HotelDetails` component uses several imports to function correctly:

- `FunctionComponent` from `react`: This import is used for typing the component as a functional component in TypeScript.
- `IHotel` from `models/data/IHotel`: Interface for the `hotel` prop, providing a structured data type for hotel information.
- `RatingsDetails` from `frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails`: A component to display the ratings details of a hotel.
- `HotelPreviewLink` from `frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink`: A component to provide a link to the hotel's detailed view.
- `OfferCardSlider` from `frontend/components/common/OfferCardSlider/OfferCardSlider`: A component for displaying a slider of images.
- `ChevronRight` from `frontend/components/icons/ChevronRight`: An icon component used in the `HotelPreviewLink`.
- `styles` from `./HotelDetails.module.scss`: Module SCSS for styling the `HotelDetails` component.

## Structure

The `HotelDetails` component is structured as follows:

- **Props**: The component accepts `IHotelDropdownProps` which includes:
  - `fallbackHotelImage`: A string URL for a fallback image.
  - `hotel`: An object of type `IHotel`, containing details about the hotel.
  - `isHotelDetailsLinkShown`: An optional boolean to control the display of the hotel link.
  - `linkLabel`: An optional string for the text of the link.

- **JSX Structure**:
  - The component first checks if the `hotel` object exists; if not, it returns `null`.
  - The main container `<div>` uses a class from `styles.hotel`.
  - Inside the main container, there are two primary divisions:
    1. **Image Carousel**: Contains the `OfferCardSlider` to display hotel images or a fallback image.
    2. **Title and Ratings**: Displays the hotel's name and its ratings using the `RatingsDetails` component.
  - Optionally, if `isHotelDetailsLinkShown` and `linkLabel` are provided, a `HotelPreviewLink` is rendered to navigate to more detailed information about the hotel.

## Logic

- **Conditional Rendering**:
  - The component renders `null` if there is no `hotel` data provided, ensuring that the rest of the component logic only runs when valid hotel data is available.
  - The link to hotel details is conditionally rendered based on `isHotelDetailsLinkShown` and `linkLabel`, ensuring that the link is only shown when both conditions are met.

- **Data Handling**:
  - The `OfferCardSlider` is utilized to handle the display of hotel images, with a fallback image provided if necessary.
  - Hotel name and ratings are directly passed to respective components (`RatingsDetails`), simplifying the display logic.

- **Styling**:
  - The component uses SCSS modules for styling, which helps in maintaining scoped and manageable CSS.

This structure and logic ensure that the `HotelDetails` component is both flexible and robust, suitable for displaying various details about a hotel in a clean and user-friendly interface.