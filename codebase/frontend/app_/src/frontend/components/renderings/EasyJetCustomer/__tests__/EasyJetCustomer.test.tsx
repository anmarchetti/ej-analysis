import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import EasyJetCustomer from 'frontend/components/renderings/EasyJetCustomer/EasyJetCustomer';

jest.mock('frontend/components/common/JSSImage', () => () => false);
jest.mock('frontend/components/common/RouterLink', () => () => false);

const mockProps = {
    fields: {
        Image: { value: mockSitecoreImageField('image') },
        Title: mockSitecoreField('Title'),
        Text: mockSitecoreField('Text'),
        Link: { value: { href: 'test-1', text: 'text-1', linktype: SitecoreLinkType.External } },
    },
};

describe('<EasyJetCustomer />', () => {
    it(`Should render`, () => {
        const { getByText } = render(<EasyJetCustomer {...mockProps} />);
        expect(getByText('Title')).toBeInTheDocument();
    });
});
