import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';
import { ILanguageSelectorFields } from 'frontend/components/renderings/LanguageSelector/LanguageSelector';

import INavLink from './INavLink';

export interface IPageHeaderFields {
    ActionNavigationAriaLabel: ISitecoreField<string>;
    Logo: ISitecoreField<ISitecoreImage>;
    LogoLink: ISitecoreField<ISitecoreLink>;
    MenuAriaLabel: ISitecoreField<string>;
    PrimaryNavigationAriaLabel: ISitecoreField<string>;
    LanguageSelector?: ISitecoreCompositeField<ILanguageSelectorFields>;
    MainNav?: INavLink[];
    SecondaryNav?: INavLink[];
    TradeLogo?: ISitecoreField<ISitecoreImage>;
}
