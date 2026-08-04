### Imports

The code imports various utilities, hooks, and types from different modules:

- **Hooks:**
  - `useXSMobileViewport`: A custom React hook from `frontend/hooks/useMediaQuery` to determine if the viewport matches an extra-small size.

- **Utilities:**
  - `splitArrayIntoNChunks`: A utility from `frontend/utils/chunkArray` to divide an array into multiple sub-arrays.
  - `isBackend`: A utility from `frontend/utils/isBackend` to check if the current runtime environment is server-side.
  - `sortBy`: A sorting utility from `frontend/utils/sort.utils` for sorting data based on a specified property.

- **Models and Types:**
  - `SitecoreLinkType`: An enumeration from `models/enum/SitecoreLinkType` defining different types of links managed in Sitecore.
  - `ISitecoreField` and `ISitecoreLink`: Interfaces from `models/sitecore/generic/ISitecoreField` representing the structure of fields and links in Sitecore.

- **Local Types:**
  - `ICollapsibleLinksModuleFields` and `ICollapsibleLinksModuleParams`: Interfaces defined in the same directory (`./CollapsibleLinksModule`) to type the expected structure of fields and parameters passed to the hooks.

### Structure

The code defines two main React hooks:

1. **`useCollapsibleLinksByColumns`**:
   - **Parameters**:
     - `fields`: Nullable object of type `ICollapsibleLinksModuleFields` containing data about pages and links.
     - `params`: Object of type `ICollapsibleLinksModuleParams` containing settings like number of columns on mobile and desktop.
   - **Returns**:
     - An object containing:
       - `links`: An array of `ISitecoreField<ISitecoreLink>`.
       - `linksByColumns`: A 2D array where each sub-array contains links for a specific column.
       - `numberOfColumns`: The number of columns determined based on the viewport size.

2. **`useMaxVisibleLinksInColumn`**:
   - **Parameters**:
     - `isBlockExpanded`: Boolean indicating if the collapsible block is expanded.
     - `totalLinksNumber`: Total number of links.
     - `totalInitialVisibleLinks`: Number of links initially visible.
     - `numberOfColumns`: Number of columns in the layout.
   - **Returns**:
     - The maximum number of visible links per column, calculated based on whether the content is server-rendered, the block is expanded, and the viewport size.

### Logic

1. **`useCollapsibleLinksByColumns`**:
   - Determines if the viewport is extra-small using `useXSMobileViewport`.
   - Retrieves links either from `Pages` or `Links` fields based on availability and formats them into `ISitecoreField<ISitecoreLink>`.
   - Sorts the links alphabetically by the text of the link.
   - Calculates the number of columns based on the viewport size and provided parameters.
   - Splits the links into the determined number of columns using `splitArrayIntoNChunks`.

2. **`useMaxVisibleLinksInColumn`**:
   - Determines if the viewport is extra-small.
   - Calculates the total number of links to show based on whether the code is running on the server or the block is expanded. On mobile, it limits the number of visible links to `totalInitialVisibleLinks`.
   - Distributes the total visible links evenly across the columns, rounding up to ensure all links are shown.

This structure and logic facilitate the creation of a responsive, collapsible link module that adapts to different device sizes and user interactions.