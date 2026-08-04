## Imports

The code imports various JavaScript modules and TypeScript types from different locations within the project. Here's a breakdown of the imports:

- **Currency and Tokens**: Imports related to currency formatting (`CurrencyCode`, `ICurrencyFormatOptions`) and tokens (`Tokens`) from the `code` directory.
- **Hooks and Stores**: Utilizes the `useStore` custom React hook from `frontend/hooks` to access global state, and imports type `TStores` from `frontend/store/IStores`.
- **Utility Functions**: Imports several utility functions (`getDiscount`, `getDiscountPerPerson`, `containsLuxuryPromoCode`) from `frontend/utils`.
- **Tokenizer**: Imports `Tokenizer` from `frontend/utils` for replacing tokens within strings.
- **Models and Components**: Types related to offers (`IOffer`, `IOfferWithoutAltBoards`) and components (`ISliderImage`, `ISliderVideo`, `VIDEO_THUMBNAIL_IMAGE`) are imported from `models/data` and `frontend/components/common` respectively.
- **Constants**: Constants such as `VIDEO_OPTIONS`, `LUX_BLUR_IMG_ID`, and `LUX_MAIN_IMG_ID` are defined within the file or imported.

## Structure

The file defines a series of functions and one React hook that are exported for use in other parts of the application:

- **`useIsLuxuryStatus`**: A custom React hook that determines if the current route is associated with a luxury promo code.
- **`shouldPreventFullScreenActivation`**: A function to check conditions to prevent full-screen activation based on the image source and data attributes.
- **`getDesktopLuxuryProps`**: A function that prepares properties for luxury desktop presentation, handling video and image display logic.
- **`getCardDescription`**: A function that constructs a description for an offer card, potentially including dynamic discount information.
- **`changeMainImageSrcInEditMode`**: A function to change the main image source in a luxury carousel when in edit mode.
- **`handleThumbnailClickInEditMode`**: A function to handle thumbnail clicks in edit mode, adjusting the main carousel's index accordingly.

## Logic

### Luxury Status Check
- **`useIsLuxuryStatus`**: Uses the `useStore` hook to access the layout store and checks if any promo code in the provided collection or from the layout's route matches a luxury promo code.

### Full-Screen Activation Prevention
- **`shouldPreventFullScreenActivation`**: Determines whether full-screen mode should be prevented based on the source of the image and checks against predefined video options.

### Desktop Luxury Display Properties
- **`getDesktopLuxuryProps`**: Configures properties for displaying luxury items on desktop. It decides whether to show a video or an image based on the availability of a video ID and user's cookie consent. It also defines handlers for playing the video or expanding the view.

### Offer Card Description
- **`getCardDescription`**: Generates a description for an offer card, inserting dynamic discount values if applicable. It uses the `Tokenizer` to replace placeholders with actual discount values.

### Edit Mode Image Source Management
- **`changeMainImageSrcInEditMode`** and **`handleThumbnailClickInEditMode`**: These functions manage the image sources and carousel index when the application is in luxury edit mode, ensuring that the display updates according to user interactions and edits.