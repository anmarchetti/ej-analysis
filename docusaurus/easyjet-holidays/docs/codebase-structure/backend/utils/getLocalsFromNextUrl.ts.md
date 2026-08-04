## Imports

The code imports two modules and two types:

1. **qs**: A query string parsing and stringifying library with some added security.
   
   ```javascript
   import qs from 'qs';
   ```

2. **TSitecoreLangs**: A TypeScript type imported from `code/cmsLang`, likely defining acceptable language types for Sitecore CMS.

   ```javascript
   import { TSitecoreLangs } from 'code/cmsLang';
   ```

3. **TResponseLocals**: A TypeScript type imported from `lib/page-props`, likely defining the structure for response local variables.

   ```javascript
   import { TResponseLocals } from 'lib/page-props';
   ```

## Structure

The structure of the code revolves around a single function named `getLocalsFromNextUrl`. This function is designed to extract and process local variables from a URL formatted specifically for Next.js data fetching paths.

### Function Signature

```typescript
export const getLocalsFromNextUrl = (url: string, routes: string[]): TResponseLocals => { ... };
```

- **Parameters**:
  - `url`: A string representing the Next.js data fetching URL.
  - `routes`: An array of strings representing possible routes.

- **Return Type**: `TResponseLocals` which is expected to be an object containing local variables such as `basePath`, `path`, and `lang`.

## Logic

### Query String Parsing

The function begins by parsing the query string part of the URL using the `qs` library:

```javascript
const pathsObj = qs.parse(url.split('?')[1]);
```

This step isolates the query string after the `?` character and parses it into an object (`pathsObj`).

### Path Validation

The code checks if the `path` key in `pathsObj` exists, is an array, has at least one element, and that the first element is a string:

```javascript
if (
    !(
        pathsObj?.path &&
        Array.isArray(pathsObj.path) &&
        pathsObj.path.length &&
        typeof pathsObj.path[0] === 'string'
    )
) {
    return {};
}
```

If any of these conditions fail, the function returns an empty object.

### Constructing Whole Path

Assuming validation passes, the function constructs a `wholePath` string by joining all elements in the `path` array, prefixed with a `/`, and converts it to lowercase:

```javascript
const wholePath = `/${pathsObj.path.join('/')}`.toLowerCase();
```

### Route Matching

The function then iterates over the provided `routes`:

```javascript
for (const route of routes) {
    const routeRegex = new RegExp(route);
    const match = wholePath.match(routeRegex);

    if (!match) {
        continue;
    }

    const basePath = match[0];
    const path = wholePath.replace(basePath, '');

    return {
        basePath: basePath,
        path: path || '/',
        lang: pathsObj.path?.[0].toLowerCase() as TSitecoreLangs,
    };
}
```

- Each route is converted into a regular expression and tested against `wholePath`.
- If a match is found, it extracts the `basePath`.
- The `path` is derived by removing `basePath` from `wholePath`.
- The function returns an object with `basePath`, `path`, and `lang` (the first element of the original `path` array, converted to lowercase).

If none of the routes match, the function returns an empty object. This ensures that the function either returns a fully populated `TResponseLocals` object or an empty one, depending on whether a valid route and path are found in the URL.