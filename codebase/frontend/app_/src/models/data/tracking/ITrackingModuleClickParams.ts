import { ModuleLocation } from 'models/enum/tracking/ModuleLocation';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

export interface ITrackingModuleClickParams {
    IsModuleClickTrackingEnabled?: TSitecoreCheckboxValue;
    ModuleLocation?: ModuleLocation;
}
