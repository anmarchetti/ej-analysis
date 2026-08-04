## Imports

The code snippet begins by importing necessary modules and utilities which are crucial for the functionality of the application:

- `getWepApiUri` from `'code/endpoints'`: This function is likely used to retrieve the base URI for the web API calls.
- `createDebouncedRequest` from `'frontend/utils/debouncedRequest.utils'`: A utility function for creating debounced network requests, which helps in reducing the number of requests sent to the server by delaying the request until a certain amount of time has passed without any other requests being made.
- `AxiosRequest` from `'frontend/utils/request'`: This is presumably a configured Axios instance tailored for the application's needs to make HTTP requests.

## Structure

The code defines two main export functions that are used to interact with an address lookup service:

1. `searchAddressItem`: This function is designed to retrieve detailed information about an address based on an ID. It is wrapped with a debounced request handler.
   
2. `searchAddressList`: This function is used for searching a list of addresses that match a given query string. It also utilizes the debounced request handler.

Both functions use generic types to enforce the structure of parameters and return types, ensuring type safety and clarity in usage.

## Logic

### `searchAddressItem`

- **Function Parameters and Debouncing**: The function takes an `id` and `params` which includes an ISO country code (`iso2`) and a callback function (`onChange`). The request is debounced by 300 milliseconds.
- **API Request**: It constructs an API endpoint using `getWepApiUri` and appends `/address-lookup/retrieve` to it. The request is made using the `AxiosRequest.get` method with the `id` and `iso2` as parameters.
- **Response Handling**: On successful retrieval of the data, the `onChange` callback is invoked with the retrieved data, and then the data is returned.

### `searchAddressList`

- **Function Parameters and Debouncing**: Similar to `searchAddressItem`, it accepts a `query` string and `params` containing an ISO country code (`iso2`). This request is also debounced by 300 milliseconds.
- **API Request**: Constructs the API URL in a similar manner but points to `/address-lookup`. The request includes the `query` and `iso2` as parameters.
- **Response Transformation**: The response is expected to have a list of items, each containing address details. The function maps over these items, restructuring each item to include `label` and `value` properties derived from `item.addressLine`. If no items are found, an empty array is returned.

Both functions handle possible exceptions by leveraging the promise-based nature of Axios, where errors would be propagated to the caller if not caught within the function itself.