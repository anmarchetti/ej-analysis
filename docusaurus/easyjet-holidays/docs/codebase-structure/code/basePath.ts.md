## Imports

The code begins by importing a type `TUrlLang` from a local module `./cmsLang`. This type is presumably used to define the permissible set of language codes (like 'en', 'ch-fr', etc.) that are used within the application.

```javascript
import { TUrlLang } from './cmsLang';
```

## Structure

The code defines a constant `HOLIDAYS_BASE_PATH` which is a TypeScript `Record`. This `Record` maps language codes of type `TUrlLang` to their corresponding base paths as strings. Each key-value pair in the record represents a language code and its associated path for holiday-related pages.

```javascript
export const HOLIDAYS_BASE_PATH: Record<TUrlLang, string> = {
    en: '/en/holidays',
    'ch-fr': '/ch-fr/vacances',
    'ch-de': '/ch-de/ferien',
    it: '/it/vacanze',
    es: '/es/vacaciones',
    de: '/de/urlaub',
    fr: '/fr/vacances',
    nl: '/nl/vakantie',
};
```

## Logic

The exported function `buildBasePathByLang` constructs a URL path for holidays based on the provided language code (`lang`). It also considers whether the path is for a trade portal by checking the `isTradePortal` boolean flag.

### Parameters:
- `lang`: A string representing the language code.
- `isTradePortal`: An optional boolean flag that defaults to `false`. If set to `true`, the function appends `/trade-portal` to the base path.

### Functionality:
1. **Language Fallback**: The function first attempts to fetch the base path corresponding to the provided `lang` from `HOLIDAYS_BASE_PATH`. If the language code does not exist in the record, it defaults to the English ('en') path.
   
2. **Path Construction**: If `isTradePortal` is `true`, the function appends `/trade-portal` to the selected base path. If `false`, it returns the base path as is.

```javascript
export const buildBasePathByLang = (lang: string, isTradePortal: boolean = false): string => {
    const holidaysBasePath = HOLIDAYS_BASE_PATH[lang] ?? HOLIDAYS_BASE_PATH.en;

    return isTradePortal ? `${holidaysBasePath}/trade-portal` : `${holidaysBasePath}`;
};
```

### Example Usage:
- `buildBasePathByLang('fr')` would return `'/fr/vacances'`.
- `buildBasePathByLang('abc')` would return `'/en/holidays'` (fallback to English).
- `buildBasePathByLang('es', true)` would return `'/es/vacaciones/trade-portal'`.