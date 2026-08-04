## Imports

This JavaScript code snippet does not include any explicit imports from other modules or libraries. It utilizes the built-in `URL` object available in modern JavaScript environments (both browser and Node.js) to construct URLs.

## Structure

The code defines a single exported function `buildBackLinkUrl` which takes two parameters:

- `referrer`: a `Nullable<string>` indicating the URL of the page that referred the user to the current page. This can be `null` or a string.
- `returnPath`: a `string` that specifies a path to use for constructing the back link URL.

The function returns a string or `null`. The string is the URL constructed based on the `returnPath` and `referrer`, or `null` if the URL cannot be constructed.

### Function Signature

```typescript
export const buildBackLinkUrl = (referrer: Nullable<string>, returnPath: string): string | null
```

## Logic

### Overview

The function `buildBackLinkUrl` is designed to determine a URL to which a user might be directed when they wish to go back to a previous page (commonly a page listing flights, as hinted by the variable name `backToFlightsUrl`). It only constructs this URL if both `referrer` and `returnPath` are provided and valid.

### Detailed Steps

1. **Initialization**:
   - The function initializes a variable `backToFlightsUrl` to `null`. This will hold the final URL or remain `null` if the URL cannot be constructed.

2. **Condition Check**:
   - The function checks if both `referrer` and `returnPath` are truthy. This is crucial because constructing a URL requires both a base URL (`referrer`) and a relative URL (`returnPath`).

3. **URL Construction**:
   - Inside a `try` block, the function attempts to create a new `URL` object using `returnPath` as the relative URL and `referrer` as the base URL.
   - If successful, the `toString()` method of the `URL` object is called to convert the URL object back to a string, which is then stored in `backToFlightsUrl`.

4. **Error Handling**:
   - The `try` block is followed by an empty `catch` block. This means that if an error occurs during URL construction (e.g., if `referrer` is not a valid URL), the function will silently fail and `backToFlightsUrl` will remain `null`.

5. **Return Value**:
   - The function returns `backToFlightsUrl`. This will either be the string URL if construction was successful, or `null` if it was not.

### Use Case

This function is useful in scenarios where a web application needs to dynamically determine a back navigation URL based on the user's navigation history and specific paths within the application. It ensures that the user is redirected correctly only when coming from a known and valid referrer.