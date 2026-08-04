## Imports

The code does not explicitly import modules within the provided snippet. However, it assumes that the `google.maps.Map` type is available, likely from the Google Maps JavaScript API. Ensure that the Google Maps API is properly loaded in your project either via a script tag in your HTML or through a package manager like npm.

## Structure

The code snippet defines two functions `onZoomChangedCallback` and `changeZoom`, both of which are exported for use elsewhere in your application. These functions interact with a Google Maps object, specifically focusing on zoom functionalities.

### onZoomChangedCallback Function

- **Parameters**: An object containing:
  - `map`: Instance of `google.maps.Map`.
  - `setZoomStatus`: A callback function that takes a number as an argument.
  - `maxZoom`: Maximum allowable zoom level as a number.
  - `minZoom`: Minimum allowable zoom level as a number.
  
- **Returns**: A function of type `() => void`.

- **Description**: This function returns another function that, when called, checks the current zoom level of the map against the provided `maxZoom` and `minZoom` values. Depending on the current zoom level, it calls `setZoomStatus` with `1` if the zoom level is at `maxZoom`, `-1` if it's at `minZoom`, or `0` otherwise.

### changeZoom Function

- **Parameters**: An object containing:
  - `map`: Instance of `google.maps.Map`.
  - `value`: A number indicating how much to change the zoom level.

- **Returns**: Nothing (`void`).

- **Description**: This function adjusts the map's zoom level by a specified `value`. The current zoom level is retrieved, modified by `value`, and then set back on the map.

## Logic

### onZoomChangedCallback Function Logic

1. Retrieve the current zoom level of the map using `map.getZoom()`.
2. Compare the current zoom level with `maxZoom` and `minZoom`.
3. If the current zoom level equals `maxZoom`, set a variable `max` to `1`.
4. If the current zoom level equals `minZoom`, set a variable `min` to `-1`.
5. If neither condition is met, both `max` and `min` remain `0`.
6. Execute `setZoomStatus` with either `max` or `min`. If `max` is `1`, it will be passed, otherwise, `min` will be passed.

### changeZoom Function Logic

1. Get the current zoom level of the map.
2. Add the `value` to the current zoom level.
3. Set the new zoom level back on the map using `map.setZoom()`.

These functions are essential for handling zoom-related functionalities on a Google Maps instance, providing both the ability to react to changes in zoom level and to programmatically adjust the zoom level based on user interactions or other logic in your application.