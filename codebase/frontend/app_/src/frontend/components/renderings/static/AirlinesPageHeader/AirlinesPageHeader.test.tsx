import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { AirlinesPageHeader } from './AirlinesPageHeader';

const mockLinkComponent = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLinkComponent(props);

        return (
            <button data-tid='link' onClick={props.onClick}>
                {children}
            </button>
        );
    },
}));

const mockJSSImageNextComponent = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNextComponent(props);

        return <div data-tid='jss-image-next' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps: ISitecoreComponent<IPageHeaderFields, undefined>;
let mockStores;

describe('AirlinesPageHeader', () => {
    beforeEach(() => {
        mockProps = {
            fields: {
                Logo: mockSitecoreField(mockSitecoreImageField('img.png')),
                LogoLink: mockSitecoreField(mockSitecoreLinkField('/home')),
            } as IPageHeaderFields,
            rendering: { placeholders: {} },
            params: undefined,
        };
        mockStores = createMockStores({
            layoutStore: {
                isPaymentPage: false,
                basePath: '/',
            },
            trackingStore: {
                trackNavigationClick: jest.fn(),
            },
            viewBookingStore: {
                clearBooking: jest.fn(),
            },
        });
    });

    it('should render null when fields are not provided', () => {
        mockProps.fields = undefined;

        const { container } = render(<AirlinesPageHeader {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render logo with link when not on payment page', () => {
        render(<AirlinesPageHeader {...mockProps} />);

        expect(mockLinkComponent).toHaveBeenCalledWith({
            href: '/home',
            className: 'link',
            onClick: expect.any(Function),
        });
        expect(mockJSSImageNextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Logo,
            height: 26,
            width: 114,
            priority: true,
        });
    });

    it('should render logo without link when on payment page', () => {
        mockStores.layoutStore.isPaymentPage = true;

        const { getByRole } = render(<AirlinesPageHeader {...mockProps} />);

        const link = getByRole('link', { hidden: true });

        expect(link).toHaveAttribute('href', '/');
        expect(mockJSSImageNextComponent).toHaveBeenCalledWith({
            field: mockProps.fields!.Logo,
            height: 26,
            width: 114,
            priority: true,
        });
    });

    it('should render title bar placeholder when provided', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.TitleBar]: [{}] } };

        const { container } = render(<AirlinesPageHeader {...mockProps} />);

        expect(container.getElementsByClassName('titleBar')[0]).toBeInTheDocument();
    });

    it('should render subheader placeholder when provided', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.Subheader]: [{}] } };

        const { container } = render(<AirlinesPageHeader {...mockProps} />);

        expect(container.getElementsByClassName('subheader')[0]).toBeInTheDocument();
    });

    it('should track navigation click and clears booking on logo click', () => {
        render(<AirlinesPageHeader {...mockProps} />);

        fireEvent.click(screen.getByRole('button'));

        expect(mockStores.trackingStore.trackNavigationClick).toHaveBeenCalledWith(
            EventTypes.NavigationBarMenuClick,
            expect.any(Object),
        );
        expect(mockStores.viewBookingStore.clearBooking).toHaveBeenCalled();
    });
});
