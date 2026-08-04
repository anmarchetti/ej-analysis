import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import INavLink from 'models/data/INavLink';
import { ModuleLocation } from 'models/enum/tracking/ModuleLocation';
import {
    ICollapsibleLinksModuleFields,
    ICollapsibleLinksModuleParams,
} from 'frontend/components/renderings/CollapsibleLinksModule/CollapsibleLinksModule';

export const mockLinks: INavLink[] = [
    { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-1', 'link-1')) } }, id: '1' },
    { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-2', 'link-2')) } }, id: '2' },
    { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-3', 'link-3')) } }, id: '3' },
    { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-4', 'link-4')) } }, id: '4' },
    { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-5', 'link-5')) } }, id: '5' },
];

export const mockLinksToRender = mockLinks.map(item => item.fields.Link);

export const collapsibleLinksFieldsMock: ICollapsibleLinksModuleFields = {
    Title: mockSitecoreField('Title'),
    Subtitle: mockSitecoreField('Subtitle'),
    Icon: mockSitecoreField(mockSitecoreImageField('icon')),
    Links: mockLinks,
};
export const collapsibleLinksParamsMock: ICollapsibleLinksModuleParams = {
    MaxVisibleLinks: '',
    MaxVisibleLinksOnMobile: '',
    Columns: '3',
    ColumnsOnMobile: '2',
    TitleTag: 'p',
    IsModuleClickTrackingEnabled: '1',
    ModuleLocation: ModuleLocation.TopBanner,
    ...mockCustomisableParams,
};
