import { GenderType } from 'models/enum/GenderType';
import { GuestType } from 'models/enum/GuestType';
import SiteSettings from 'models/enum/SiteSettings';

export const GuestTypeIcon = {
    [GuestType.Adult]: SiteSettings.AdultsIcon,
    [GuestType.Child]: SiteSettings.ChildIcon,
    [GuestType.Infant]: SiteSettings.InfantIcon,
    [GenderType.Female]: SiteSettings.FemaleIcon,
    [GenderType.Male]: SiteSettings.MaleIcon,
    Default: SiteSettings.AdultsIcon,
};
