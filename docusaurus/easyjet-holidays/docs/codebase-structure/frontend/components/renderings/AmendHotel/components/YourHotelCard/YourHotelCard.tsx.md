### Imports

The `YourHotelCard` component imports various modules, components, and styles necessary for its functionality:

- **React and MobX**: Uses `FunctionComponent` from `react` and `observer` from `mobx-react` for creating a functional component and enabling reactive state management.
- **Utility Functions and Models**: Imports `getHotelLocation` from a utility module and `IBookingInfo` from a model module to handle hotel location fetching and typing for booking information.
- **Components**: Imports several UI components like `BlockSelected`, `EcoCertifiedPill`, `OfferCardSlider`, `StarRating`, `OfferExtras`, and `TripadvisorInfo` to be used within the `YourHotelCard` for displaying various UI elements.
- **Enums and Styles**: Imports `SitecoreDictionary` for constants and `styles` from a SCSS module for styling the component.

### Structure

The `YourHotelCard` component is structured into several key visual parts:

- **Image Carousel**: Displays hotel images using the `OfferCardSlider` component. It shows a fallback image if no images are available and allows full-screen view.
- **Card Body**: Contains detailed sections about the hotel and selected offers.
  - **Details Section**: Shows hotel name, location, star rating, and TripAdvisor information if available. Also displays an eco-certification pill if the hotel has eco facilities.
  - **Selected Section**: Displays a selected block, typically used for showing selected offers or features, using the `BlockSelected` component with a key from `SitecoreDictionary`.

### Logic

The component's logic primarily revolves around extracting and presenting data:

- **Star Rating Parsing**: Converts the `starRating` string from the hotel data to an integer to be used by the `StarRating` component.
- **Hotel and Room Details**: Extracts hotel name, location, and room details (room type and board type) from the `booking` prop.
- **Image Handling**: Uses `getHotelMeta` to fetch an array of hotel images for the carousel.
- **Conditional Rendering**: Several parts of the UI are conditionally rendered based on the availability of data, such as TripAdvisor information and eco-facility details.

The component is wrapped in `observer` from MobX, making it reactive to changes in observable data used within, ensuring the UI updates appropriately when underlying state changes.