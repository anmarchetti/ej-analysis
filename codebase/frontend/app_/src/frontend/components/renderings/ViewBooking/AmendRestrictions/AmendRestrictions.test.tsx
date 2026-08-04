import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import AmendRestrictions, { IAmendRestrictionsProps } from './AmendRestrictions';

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlock(props);

        return <div data-tid='info-block' />;
    },
}));

const createDepDate = (numberOfDays: number) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + numberOfDays);

    return futureDate;
};

const createProps = (): IAmendRestrictionsProps => ({
    depDate: createDepDate(1),
    isLeadLoggedIn: true,
    isExternalAgency: false,
    params: {},
    rendering: {},
    fields: {
        items: [
            {
                fields: {
                    TimeRestriction: mockSitecoreField(0),
                    Title: mockSitecoreField('No Restriction Title'),
                    Description: mockSitecoreField('No Restriction Description'),
                    Icon: mockSitecoreField({ src: 'icon.png', alt: 'icon' }),
                    Link: mockSitecoreField({
                        href: 'https://example.com',
                        text: 'Example Link',
                        linktype: SitecoreLinkType.External,
                    }),
                },
            },
            {
                fields: {
                    TimeRestriction: mockSitecoreField(48),
                    Title: mockSitecoreField('Restriction Title'),
                    Description: mockSitecoreField('Restriction Description'),
                    Icon: mockSitecoreField({ src: 'icon2.png', alt: 'icon2' }),
                    Link: mockSitecoreField({
                        href: 'https://example.com',
                        text: 'Example Link',
                        linktype: SitecoreLinkType.External,
                    }),
                },
            },
            {
                fields: {
                    TimeRestriction: mockSitecoreField(0),
                    Title: mockSitecoreField('External Agency Restriction Title'),
                    Description: mockSitecoreField('External Agency Description'),
                    Icon: mockSitecoreField({ src: 'icon2.png', alt: 'icon2' }),
                    Link: mockSitecoreField({
                        href: 'https://example.com',
                        text: 'Example Link',
                        linktype: SitecoreLinkType.External,
                    }),
                    IsExternal: mockSitecoreField(true),
                },
            },
            {
                fields: {
                    TimeRestriction: mockSitecoreField(0),
                    Title: mockSitecoreField('Luxury Title'),
                    Description: mockSitecoreField('Luxury Description'),
                    Icon: mockSitecoreField({ src: 'icon2.png', alt: 'icon2' }),
                    Link: mockSitecoreField({
                        href: 'https://example.com',
                        text: 'Example Link',
                        linktype: SitecoreLinkType.External,
                    }),
                    IsLux: mockSitecoreField(true),
                    CTA: mockSitecoreField('Luxury CTA'),
                },
            },
            {
                fields: {
                    TimeRestriction: mockSitecoreField(0),
                    Title: mockSitecoreField('Luxury External Title'),
                    Description: mockSitecoreField('Luxury External Description'),
                    Icon: mockSitecoreField({ src: 'icon2.png', alt: 'icon2' }),
                    Link: mockSitecoreField({
                        href: 'https://example.com',
                        text: 'Example Link',
                        linktype: SitecoreLinkType.External,
                    }),
                    IsLux: mockSitecoreField(true),
                    IsExternal: mockSitecoreField(true),
                },
            },
        ],
    },
});

const createStores = () =>
    createMockStores({
        viewBookingStore: { isLuxuryPackage: false },
        layoutStore: { isTradePortal: false },
    });

let mockStores = createStores();

let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendRestrictions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render no restriction field when departure is within time restriction', () => {
        const fields = mockProps.fields!.items[0].fields;
        render(<AmendRestrictions {...mockProps} />);
        expect(mockInfoBlock).toHaveBeenCalledWith({
            btnClass: 'action',
            link: fields.Link,
            icon: fields.Icon,
            title: fields.Title,
            text: fields.Description,
            className: 'infoBlock',
        });
    });

    it('should render restriction field when no restriction field is not available', () => {
        mockProps.fields!.items = mockProps.fields!.items.filter(
            ({ fields }) => fields?.TimeRestriction?.value || fields?.IsExternal?.value || fields?.IsLux?.value,
        );
        render(<AmendRestrictions {...mockProps} />);
        const fields = mockProps.fields!.items[0].fields;

        expect(mockInfoBlock).toHaveBeenCalledWith({
            btnClass: 'action',
            link: fields.Link,
            icon: fields.Icon,
            title: fields.Title,
            text: fields.Description,
            className: 'infoBlock',
        });
    });

    it('should NOT render when items fields do not exist', () => {
        mockProps.fields!.items = [];

        const { container } = render(<AmendRestrictions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render external agency message', () => {
        mockProps.isExternalAgency = true;
        const fields = mockProps.fields!.items[2].fields;
        render(<AmendRestrictions {...mockProps} />);

        expect(mockInfoBlock).toHaveBeenCalledWith({
            icon: fields.Icon,
            title: fields.Title,
            text: fields.Description,
            className: 'infoBlock',
        });
    });

    it('should use proper fields if lux booking', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;
        const fields = mockProps.fields!.items[3].fields;
        render(<AmendRestrictions {...mockProps} />);

        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            children: expect.anything(),
            label: fields.Title.value,
        });

        expect(mockInfoBlock).toHaveBeenCalledWith({
            btnLabel: fields.CTA,
            ctaClass: 'action luxuryAction',
            icon: fields.Icon,
            iconClass: 'icon',
            onClick: expect.any(Function),
            text: fields.Description,
            className: 'luxuryInfoBlock',
        });
    });

    it('should call toggleHelpPopup when luxury InfoBlock onClick is invoked', () => {
        mockStores.viewBookingStore.isLuxuryPackage = true;
        mockStores.viewBookingStore.toggleHelpPopup = jest.fn();
        render(<AmendRestrictions {...mockProps} />);

        const onClickArg = mockInfoBlock.mock.calls.find(call => call[0].onClick)?.[0].onClick;
        onClickArg();

        expect(mockStores.viewBookingStore.toggleHelpPopup).toHaveBeenCalledWith(true);
    });

    it('should use luxury external fields if external agency and luxury booking and not trade portal', () => {
        mockProps.isExternalAgency = true;
        mockStores.viewBookingStore.isLuxuryPackage = true;
        mockStores.layoutStore.isTradePortal = false;
        const fields = mockProps.fields!.items[4].fields;
        render(<AmendRestrictions {...mockProps} />);

        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            children: expect.anything(),
            label: fields.Title.value,
        });

        expect(mockInfoBlock).toHaveBeenCalledWith({
            btnLabel: fields.CTA,
            ctaClass: 'action luxuryAction',
            icon: fields.Icon,
            iconClass: 'icon',
            onClick: expect.any(Function),
            text: fields.Description,
            className: 'luxuryInfoBlock',
        });
    });

    it('should use external fields if external agency and not luxury and not trade portal', () => {
        mockProps.isExternalAgency = true;
        mockStores.viewBookingStore.isLuxuryPackage = false;
        mockStores.layoutStore.isTradePortal = false;
        const fields = mockProps.fields!.items[2].fields;
        render(<AmendRestrictions {...mockProps} />);

        expect(mockInfoBlock).toHaveBeenCalledWith({
            icon: fields.Icon,
            title: fields.Title,
            text: fields.Description,
            className: 'infoBlock',
        });
    });

    it('should fall back to default content when isExternalAgency and isTradePortal', () => {
        mockProps.isExternalAgency = true;
        mockStores.layoutStore.isTradePortal = true;
        const fields = mockProps.fields!.items[0].fields;
        render(<AmendRestrictions {...mockProps} />);

        expect(mockInfoBlock).toHaveBeenCalledWith({
            icon: fields.Icon,
            title: fields.Title,
            text: fields.Description,
            className: 'infoBlock',
        });
    });
});
