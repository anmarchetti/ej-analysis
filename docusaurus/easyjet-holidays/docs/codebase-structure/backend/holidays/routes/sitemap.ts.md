## Imports

The code imports several modules and functionalities required to build and serve a sitemap for a web application using Express and the `sitemap` library.

- `express`: Framework for creating server-side applications in Node.js.
- `EnumChangefreq, SitemapItemLoose, SitemapStream`: Imported from the `sitemap` library, these are used to create and configure the sitemap.
- `buildBasePathByLang`, `getLangByCMSLang`, `sitecoreUrls`: Custom utility functions and configurations specific to handling URLs and languages.
- `logger`: A logging service from the `frontend/services/logging` module, used for error logging.
- `AxiosRequest`: A utility for making HTTP requests.
- `purifyUrl`: A utility function from `frontend/utils/url.utils`, used to clean and standardize URLs.
- `ISitecoreSitemapItem`: A TypeScript interface from `models/data/ISitecoreSitemap` that defines the structure of sitemap items specific to Sitecore.

## Structure

The code is structured around defining an Express router to handle sitemap-related requests, and functions to build and serve sitemap XML files.

- **Router Definition**: `sitemapRouter` is an instance of `express.Router()`, used to define routes for sitemap requests.
- **Utility Functions**:
  - `buildSitemapItems`: Transforms Sitecore data into a format suitable for the sitemap.
  - `buildSitemap`: Asynchronously generates and serves the sitemap XML to the client.
- **Routes**:
  - Main Sitemap Route: Handles requests to `/sitemap.xml` and dynamic sub-sitemap routes like `/sitemap-xml/:name.xml`.
  - Sitemap Index Route: Handles requests to `/sitemap-index.xml` for serving a master sitemap that includes all individual sitemaps.

## Logic

### Building Sitemap Items

The `buildSitemapItems` function processes an array of `ISitecoreSitemapItem`, converting them into `SitemapItemLoose` objects. Each sitecore item is transformed based on its URL, language, change frequency, and priority. URLs are cleaned and standardized using `purifyUrl`, and the language-specific base path is prepended.

### Serving the Sitemap

The `buildSitemap` function sets the appropriate content type and attempts to fetch Sitecore sitemap data using an Axios request. It then streams the sitemap items using `SitemapStream`, handling any errors by logging them and sending an appropriate error response.

### Route Handlers

- **Main and Sub-Sitemaps**: The route handler extracts parameters from the request to determine the specific sitemap or sub-sitemap to serve, then calls `buildSitemap` with the resolved URL.
- **Sitemap Index**: This handler serves a master sitemap that includes links to all other sitemaps, facilitating search engines in content discovery across multiple languages and sections.

### Error Handling

Errors in fetching or streaming the sitemap are caught and logged. The response is then adjusted to inform the client of the issue, including setting the response status based on the error type or defaulting to 500 if the status is not available.