import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitePath from 'models/enum/SitePath';
import TradePortalPageHeader, {
    IPageHeaderParameters,
} from 'frontend/components/renderings/TradePortalPageHeader/TradePortalPageHeader';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => <div data-tid='jss-image' {...props} />,
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

const resetProps = () =>
    ({
        fields: {
            MainNav: [{ id: '' }],
            SecondaryNav: [{ id: '' }],
        },
        params: {},
    } as IPageHeaderParameters);

const createStores = () =>
    createMockStores({
        trackingStore: {
            trackNavigationClick: jest.fn(),
        },
        userStore: {
            isLoggedIn: true,
        },
        layoutStore: {
            isHomePage: true,
        },
    });

let props;
let mockStores;

describe('<TradePortalPageHeader/>', () => {
    beforeEach(() => {
        props = resetProps();
        mockStores = createStores();
    });

    it('should NOT render when fields are empty', () => {
        props.fields = undefined;
        const { container } = render(<TradePortalPageHeader {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('It is a Slim Header', () => {
        props.params.IsHeaderSlim = true;
        const { container } = render(<TradePortalPageHeader {...props} />);

        expect(container.querySelector('.header_trade--full')).not.toBeInTheDocument();
    });

    it('It is a Full Header', () => {
        props.params.IsHeaderSlim = false;
        const { container } = render(<TradePortalPageHeader {...props} />);

        expect(container.querySelector('.header_trade--slim')).not.toBeInTheDocument();
    });

    it('Header menu exist', () => {
        props.fields = {
            SecondaryNav: [
                {
                    fields: {
                        ChildrenLinks: [
                            {
                                fields: {
                                    Link: {
                                        value: {
                                            href: `a/${SitePath.HolidayCredit}/d`,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const { container } = render(<TradePortalPageHeader {...props} />);

        expect(container.querySelector('.header_trade__navigation')).toBeInTheDocument();
    });

    describe('logos', () => {
        it('should NOT render EJH logo when LogoLink is undefined', () => {
            props.fields.LogoLink = undefined;
            render(<TradePortalPageHeader {...props} />);

            expect(screen.queryByTestId('ejh-logo')).not.toBeInTheDocument();
        });

        it('should render EJH logo when LogoLink is set', () => {
            props.fields.LogoLink = mockSitecoreImageField('testSrc');
            render(<TradePortalPageHeader {...props} />);

            expect(screen.getByTestId('ejh-logo')).toBeInTheDocument();
        });

        it('should render trade logo when TradeLogo and LogoLink are set', () => {
            props.fields.TradeLogo = mockSitecoreImageField('testTradeSrc');
            props.fields.LogoLink = mockSitecoreImageField('testSrc');
            render(<TradePortalPageHeader {...props} />);

            expect(screen.getByTestId('trade-logo')).toBeInTheDocument();
        });

        it('should NOT render trade logo when TradeLogo is not set', () => {
            props.fields.TradeLogo = undefined;
            props.fields.LogoLink = mockSitecoreImageField('testSrc');
            render(<TradePortalPageHeader {...props} />);

            expect(screen.queryByTestId('trade-logo')).not.toBeInTheDocument();
        });

        it('should NOT render trade logo when LogoLink is not set', () => {
            props.fields.TradeLogo = mockSitecoreImageField('testTradeSrc');
            props.fields.LogoLink = undefined;
            render(<TradePortalPageHeader {...props} />);

            expect(screen.queryByTestId('trade-logo')).not.toBeInTheDocument();
        });
    });
});
