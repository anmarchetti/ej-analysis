import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import { IFacilityGroup } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export interface IFacilitiesProps {
    facilityGroups: IFacilityGroup[];
    hideOnPrint?: boolean;
    isPrintPreview?: boolean;
    isShowEcoFacilityPlaceholder?: boolean;
    rendering?: ComponentRendering;
    shouldShowTitle?: boolean;
    showOnPrintOnly?: boolean;
    titleDictionaryKey?: SitecoreDictionary;
}
