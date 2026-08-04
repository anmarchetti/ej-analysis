### Imports

The code begins by importing various modules and utilities necessary for its operation. These imports include both external libraries and internal modules:

- **External Libraries:**
  - `path`: Provides utilities to work with file and directory paths.
  - `cors`: Middleware to enable CORS (Cross-Origin Resource Sharing).
  - `dotenv`: Loads environment variables from a `.env` file into `process.env`.
  - `express`: Fast, unopinionated, minimalist web framework for Node.js.
  - `nextJS` from `next`: The React framework for server-rendered or statically-exported React apps.
  - `parseUrl`: Utility for parsing URLs.
  - `qs`: A querystring parsing and stringifying library with some added security.

- **Sitecore JSS and Next.js Utilities:**
  - `getPublicUrl` from `@sitecore-jss/sitecore-jss-nextjs/utils`: Utility function to get the public URL from Sitecore JSS configuration.

- **Internal Modules:**
  - Various utilities like `getEnv`, `buildRoomsQueryParams`, and `getLocalsFromNextUrl` which are likely custom functions tailored to the application's specific needs.
  - Data models and enumerations such as `IQueryRoomParams`, `HttpsStatusCodes`, `QueryParamName`, and `SiteName`.
  - Sub-applications or route handlers like `holidaysApp`, `tradePortalApp`, and their respective routes.

### Structure

The structure of the code is centered around setting up an Express server integrated with a Next.js application, configured based on environment variables and specific business logic:

- **Environment and Configuration:**
  - Determines the running environment (development or production) and sets up port and path configurations.
  - Configures environment variables using `dotenv`.
  - Determines the application behavior (trade portal or holidays app) based on the `APP_NAME` environment variable.

- **Next.js Server Options and Setup:**
  - Configures Next.js server options such as development mode, custom server flag, port, and hostname.
  - Conditionally sets the asset prefix for the Next.js application, especially handling cases for the Sitecore Experience Editor.

- **Express Server Setup:**
  - Instantiates an Express server.
  - Sets headers and defines health check endpoints.
  - Implements URL redirection logic to enforce lowercase URLs and handle old URL formats.
  - Configures middleware for parsing URL-encoded bodies, handling static files, and integrating with Next.js for certain routes.
  - Defines dynamic routing based on the application mode (trade portal or holidays).

### Logic

The logical flow of the code is designed to handle various operational aspects of a web application, including URL management, static file serving, API interactions, and conditional routing based on the application context:

- **URL Handling:**
  - Redirects all uppercase paths to lowercase unless they match specified service paths, enhancing URL consistency and SEO.
  - Handles complex query string transformations for specific parameters like rooms in a booking system.

- **Static and Media Files:**
  - Serves static assets with specific caching policies.
  - Uses CORS for certain static paths to allow resource sharing across different domains.

- **API and Placeholder Data:**
  - Manages Sitecore-specific API interactions, particularly for fetching placeholder data for dynamic content rendering.

- **Conditional Application Logic:**
  - Depending on whether the application is running as a trade portal or a holiday app, it uses different sets of routes and middleware.
  - Integrates with Next.js for handling all other routes not explicitly managed by Express, ensuring seamless SSR (Server-Side Rendering) and SPA (Single Page Application) behavior.

- **Server Initialization:**
  - Finally, the server listens on the configured port, ready to handle incoming requests.