## Imports

The `HolidayCardCTA` component uses several imports from various libraries and local modules:

- `FC` from `react`: Used to type the functional component with TypeScript.
- `classNames` from `classnames`: A utility function for conditionally joining classNames together.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the Redux store.
- `TStores` from `frontend/store/IStores`: TypeScript interface defining the type structure of the stores used in the application.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enum containing keys for site-specific dictionary entries.
- `styles` from `./HolidayCardCTA.module.scss`: Module CSS for styling the component, scoped locally to avoid clashes.

## Structure

The `HolidayCardCTA` component is defined as a functional component, utilizing TypeScript for props definition:

- **Interface `IHolidayCardCTAProps`**: Defines the props expected by the `HolidayCardCTA` component:
  - `hotelLink`: A string URL to the hotel or holiday destination.
  - `isCityBreak`: A boolean indicating if the holiday is a city break.
  - `isLuxuryPackage`: A boolean indicating if the holiday is a luxury package.

The component function itself takes these props and utilizes a custom hook `useStore` to fetch necessary data from the Redux store.

## Logic

The component's logic revolves around determining the appropriate text for the link based on the type of holiday:

- **`getLinkText` Function**: A function that returns a string. It uses conditions to check the type of holiday (`isLuxuryPackage` and `isCityBreak`) and fetches the appropriate phrase from the `SitecoreDictionary` using `getPhrase` method from the `layoutStore`.
  - If `isLuxuryPackage` is true, it fetches the phrase for viewing luxury holidays.
  - If `isCityBreak` is true, it fetches the phrase for city breaks.
  - Otherwise, it fetches a generic phrase for holidays.

The component returns an anchor (`<a>`) element styled with `classNames` to merge default button styles with specific styles defined in `styles.cardCTA`. The link:
- Opens in a new tab (`target='_blank'`).
- Includes `rel='noreferrer'` for security reasons.
- Uses `data-tid='view-holiday-btn'` for testing identification.

The text inside the anchor tag is dynamically set based on the `getLinkText` function's output. The `href` attribute is set to the `hotelLink` provided via props, directing the user to the relevant holiday or hotel link.