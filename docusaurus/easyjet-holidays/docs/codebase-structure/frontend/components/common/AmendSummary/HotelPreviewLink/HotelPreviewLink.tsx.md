### Imports

The `HotelPreviewLink` component imports several modules and components to function properly:

- `FunctionComponent` from `react`: Used to define the component type as a functional component.
- `qs` from `qs`: A query string parser used to serialize data into a URL query string.
- `useMobileViewport` from `frontend/hooks/useMediaQuery`: A custom React hook to determine if the viewport is of a mobile device size.
- `buildHotelDetailsUrl` from `frontend/utils/getHotelLocation`: A utility function that constructs a URL for hotel details based on a given hotel object.
- `IHotel` from `models/data/IHotel`: TypeScript interface that defines the structure of a hotel object.
- `QueryParamName` from `models/enum/QueryParamName`: An enumeration that stores the names of the query parameters used in the application.
- `Link` from `frontend/components/common/Link`: A React component used for navigation.

### Structure

The `HotelPreviewLink` component is structured as follows:

- **Props**: The component accepts the following props:
  - `children`: The content to be displayed within the link.
  - `hotel`: An object that conforms to the `IHotel` interface, representing the hotel details.
  - `className`: An optional string for CSS class names to apply to the link element.
  - `clickHandler`: An optional function that gets called when the link is clicked, receiving the hotel preview link as an argument.

- **Component Definition**: It is defined as a functional component using the `FunctionComponent` type from React with `IHotelPreviewLinkProps` as the props type.

### Logic

The component's logic can be outlined as follows:

1. **Mobile Check**: The `useMobileViewport` hook is called to determine if the current viewport size is mobile. This information is used to control the `target` attribute of the link.

2. **URL Construction**:
   - The `buildHotelDetailsUrl` function is called with the `hotel` object to generate the base URL for hotel details.
   - The `qs.stringify` function is used to append the `HotelPreview` query parameter to the URL, which is set to `1`.

3. **Link Rendering**:
   - The `Link` component is used to render an anchor (`<a>`) tag.
   - The `href` attribute of the anchor tag is set to the constructed `hotelPreviewLink`.
   - The `className` prop is applied to the anchor tag if provided.
   - The `target` attribute is conditionally set to `_blank` if the device is not mobile, which opens the link in a new tab.
   - The `rel="noreferrer"` attribute is added to enhance security and performance by preventing the browser from sending the HTTP referrer header.
   - An optional `onClick` handler is added to the anchor tag, which executes the `clickHandler` function with `hotelPreviewLink` as its argument if `clickHandler` is provided.

This component effectively encapsulates the logic for creating a link to the hotel details page, which considers device type and optional click handling, making it reusable and adaptable within different parts of the application where hotel links are needed.