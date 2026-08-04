import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import NeedHelpPopup, { TNeedHelpPopupProps } from './NeedHelpPopup';

const createProps = (): TNeedHelpPopupProps => ({
    fields: {
        Description: mockSitecoreField('Description'),
        Title: mockSitecoreField('Title'),
        CTA: mockSitecoreField('CTA'),
        Icon: mockSitecoreField(mockSitecoreImageField('src', 'Icon')),
        Label: mockSitecoreField('Label'),
    },
    params: {},
    rendering: {},
});

const createStores = () => ({
    viewBookingStore: { toggleHelpPopup: jest.fn(), isHelpPopupShown: true, isLuxuryPackage: true },
});

let mockProps;
const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockWarningPopup = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: props => {
        mockWarningPopup(props);

        return <div data-tid='warning-popup' />;
    },
}));

describe('<NeedHelpPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<NeedHelpPopup {...mockProps} />);

        expect(mockWarningPopup).toHaveBeenCalledWith({
            bodyClass: 'body',
            contentClass: 'content',
            ctaClass: 'cta',
            description: mockProps.fields.Description,
            icon: mockProps.fields.Icon,
            luxuryLabel: mockProps.fields.Label,
            onClose: expect.any(Function),
            onSecondaryCtaClick: expect.any(Function),
            secondaryCtaText: mockProps.fields.CTA,
            title: mockProps.fields.Title,
            footerClass: 'footer',
        });
    });

    it('should be empty render if there are not fields', () => {
        mockProps.fields = undefined;
        render(<NeedHelpPopup {...mockProps} />);

        expect(mockWarningPopup).not.toHaveBeenCalled();
    });

    it('should be empty render if not luxury package', () => {
        mockStores.viewBookingStore.isLuxuryPackage = false;
        render(<NeedHelpPopup {...mockProps} />);

        expect(mockWarningPopup).not.toHaveBeenCalled();
    });

    it('should be empty render if popup is closed', () => {
        mockStores.viewBookingStore.isHelpPopupShown = false;
        render(<NeedHelpPopup {...mockProps} />);

        expect(mockWarningPopup).not.toHaveBeenCalled();
    });
});
