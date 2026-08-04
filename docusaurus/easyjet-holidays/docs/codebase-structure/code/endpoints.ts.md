## Imports

The code imports various utilities, constants, types, and functions from external modules and local files. The primary imports include:

- `qs` and `IStringifyOptions` from the `qs` library, used for query string parsing and stringification with specific configurations.
- Utility functions from `frontend/utils/isBackend` and `frontend/utils/url.utils` which likely provide utility functions for backend checks and URL manipulations respectively.
- Several interfaces from `models/data` and `models/enum` which define the structure for data used throughout the application.
- Environment and configuration related imports from `./env` and `./cmsLang`.

## Structure

The structure of the code is modular, focusing on URL construction for various API endpoints and other functionalities. It defines multiple constants and functions to construct these URLs:

- `QS_CONFIG`: Configuration for the `qs` library to control how query strings are handled.
- `cmsUrls`: An object containing methods to generate URLs related to CMS (Content Management System) operations.
- `webApiUrls`: An object containing methods to construct URLs for various backend API endpoints related to search, booking, user management, etc.
- `getWepApiUri` and `getUMApiUri`: Functions to retrieve base URIs for different APIs based on environment settings.
- `boolToString`: Utility function to convert boolean values to their string representations.
- `userManagementApiUrls` and `tradePortalWebApiUrls`: Objects that provide URLs for user management and trade portal functionalities.
- `notificationsUrls` and `paymentTrackingUrls`: Objects that provide URLs for notification services and payment tracking functionalities.
- `shareUrls`: Object containing methods to generate URLs for sharing content via social media and other platforms.

## Logic

The logic in the code primarily revolves around constructing full URLs for various functionalities using base paths, parameters, and configurations:

1. **API URL Construction**: The `webApiUrls` object contains methods that take arguments, such as search parameters and identifiers, and return full URLs by appending these to base API paths. It uses the `qs.stringify` method extensively with the `QS_CONFIG` to include or exclude parameters based on their values.

2. **CMS URL Handling**: The `cmsUrls` object provides methods for constructing URLs that are used within the CMS for fetching data, manipulating content items, and handling media files.

3. **Utility Functions**:
   - `boolToString` is used to convert boolean values to a string format, primarily for use in query parameters where a string representation is required.
   - `getWepApiUri` and `getUMApiUri` determine the base API URI based on whether the code is running on the backend or frontend, and based on environment variables.

4. **Conditional Logic**: Many URL construction methods include conditional logic to append different parameters based on the presence of certain flags or values, ensuring that the URLs are correctly formatted for the expected API endpoints.

This structure and logic enable the application to dynamically generate accurate URLs for API requests, CMS interactions, and social sharing functionalities based on runtime conditions and provided parameters.