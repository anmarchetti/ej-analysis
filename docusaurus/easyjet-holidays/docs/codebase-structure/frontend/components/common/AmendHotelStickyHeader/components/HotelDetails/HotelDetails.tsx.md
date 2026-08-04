## Imports

The `HotelDetails` component imports several modules and resources:

- `FunctionComponent` from `react`: Utilized for declaring the type of the functional component.
- `classNames` from `classnames`: A utility to conditionally join class names together.
- `useMobileViewport` from `frontend/hooks/useMediaQuery`: A custom hook to determine if the viewport is of mobile size.
- `IBookingPackage` from `models/data/IBookingInfo`: TypeScript interface representing the booking package data structure.
- `SvgHotelLined` from `frontend/components/icons-new/HotelLined`: A React component for the hotel icon.
- `styles` from `./HotelDetails.module.scss`: Module CSS for styling the `HotelDetails` component.

## Structure

The `HotelDetails` component is defined with TypeScript and utilizes the `FunctionComponent` type from React. It accepts `IHotelDetailsProps` as props which include:

- `location`: Required property from the `IBookingPackage` interface specifying the hotel location.
- `className`: Optional string to allow custom CSS class names to be passed.
- `dataTid`: Optional string for test identifiers, defaulting to 'hotel-details'.
- `name`: Optional string representing the name of the hotel.

The internal structure of the component is straightforward:

1. **Conditional Rendering**: Based on the viewport size (mobile or not), it displays different layouts for the hotel details.
2. **Destructuring Location**: Extracts `city` and `region` from the `location` prop.
3. **Dynamic Classes and Data Attributes**: Uses `classNames` for conditional class names and custom data attributes (`data-tid`) for easier testing.

## Logic

1. **Viewport Check**: The `useMobileViewport` hook is used to determine if the current viewport matches mobile dimensions. This boolean value (`isMobile`) influences the JSX structure.
   
2. **Conditional JSX**: Depending on the `isMobile` state, the component renders:
   - For mobile viewports: A column layout with the hotel name and location displayed vertically.
   - For non-mobile viewports: A single line displaying the hotel name in bold followed by the city.

3. **Dynamic Data Attributes**: The component uses the `dataTid` prop to set base data attributes and appends specific identifiers for elements like the icon, title, and location for better specificity in tests.

This component effectively demonstrates responsive design principles, conditional rendering based on viewport, and proper use of TypeScript for prop type definitions.