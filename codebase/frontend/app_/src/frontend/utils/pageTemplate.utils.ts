import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

export const isTemplateBelongsToDestinationPage = (templateId: string) =>
    templateId === SitecoreTemplateId.CountryBrowsePage ||
    templateId === SitecoreTemplateId.RegionBrowsePage ||
    templateId === SitecoreTemplateId.ResortBrowsePage;
