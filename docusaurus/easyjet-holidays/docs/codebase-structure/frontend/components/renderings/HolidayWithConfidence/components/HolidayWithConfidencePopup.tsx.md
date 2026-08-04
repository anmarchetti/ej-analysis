## Imports

The component imports various libraries, components, and types necessary for its functionality:

- **React**: Utilized for building the component using JSX.
- **Text**: A component from `@sitecore-jss/sitecore-jss-nextjs` used for rendering text fields from Sitecore.
- **inject**: A function from `mobx-react` used for injecting stores into the component.
- **TStores**: A type representing the MobX stores.
- **IConfidenceModuleFields**: Interface representing the fields expected in the confidence module.
- **SitecoreDictionary, IComponentWithDictionary, ISitecoreCompositeField**: Various models and interfaces from the project that help with typing and structuring the data.
- **Button, Drawer, Popup, RichTextWithLinks, RouterLink, IconChevronRight**: Reusable UI components and icons used within this component.
- **ConfidencePopupListItem**: A custom React component specific to the confidence popup feature.

## Structure

The component `HolidayWithConfidencePopup` is a functional React component that takes props of type `IHolidayWithConfidencePopupProps`. This interface extends other interfaces to include fields related to the Sitecore item, dictionary phrases, and additional props related to the UI state:

- **isScreenMedium**: Boolean indicating if the current screen size is medium.
- **isShowPopup**: Boolean controlling the visibility of the popup.
- **togglePopup**: Function to toggle the state of the popup.

The component conditionally renders different UI elements based on the screen size (`isScreenMedium`). For medium screens, it uses a `Popup` component, and for others, it uses a `Drawer`.

The `popupContent` variable defines the content of the popup, including titles, subtitles, and a list of items (each represented by `ConfidencePopupListItem`). It also optionally includes a link with an icon.

The `footerContent` variable defines the content of the footer, primarily consisting of a button to close the popup.

## Logic

- **togglePopup Function**: A local function `toglePopup` is defined (note the typo in the function name) to handle the closing of the popup. This function calls the `togglePopup` prop with `false` to set the popup's state to closed.
  
- **Rendering**: The component decides what to render based on the `isScreenMedium` and `isShowPopup` props. For medium screens, it uses the `Popup` component, and for non-medium screens, it uses the `Drawer` component. Both components are passed the `popupContent` and `footerContent`.

- **Connected Component**: The `HolidayWithConfidencePopup` component is wrapped with `inject` to inject MobX stores into the props. It specifically uses `layoutStore.getPhrase` for fetching localized phrases and `appStore.isScreenMedium` to determine if the screen is medium-sized.

- **Conditional Rendering**: The component only renders if `isShowPopup` is true, ensuring that the popup or drawer only appears when required.

This structure and logic ensure that the component is both reusable and adaptable to different screen sizes and state changes, making it a robust part of the user interface.