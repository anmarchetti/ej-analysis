import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockCustomisableParams } from 'frontend/__mocks__/customisableParams';
import * as customisationUtils from 'frontend/utils/componentStylesCustomisation.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as urlUtils from 'frontend/utils/url.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import SubscribeBlock, { TSubscribeBlockProps } from './SubscribeBlock';

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextComponent(props);

        return <div data-tid='text-component'>{field.value}</div>;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, className, onClick }) => (
        <button className={className} onClick={onClick} onKeyDown={jest.fn()} data-tid='router-link'>
            {children}
        </button>
    ),
}));

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({ label, ...props }) => {
    mockCheckboxProps(props);

    return <div data-tid='checkbox'>{label} </div>;
});

jest.spyOn(customisationUtils, 'getCustomisableTitleClassName').mockReturnValue('getCustomisableTitleClassName');
jest.spyOn(customisationUtils, 'getPaddingSizeClassName').mockReturnValue('getPaddingSizeClassName');
jest.spyOn(urlUtils, 'buildSitecoreLinkFullUrl').mockReturnValue('new-url');

const resetMocks = () =>
    ({
        fields: {
            Title: mockSitecoreField('Title'),
            Description: mockSitecoreField('Description'),
            SignUpLinkPlaceholder: mockSitecoreField('SignUpLinkPlaceholder'),
            SignUpLink: mockSitecoreField({
                href: 'test',
                text: 'SignUpLink',
                linktype: SitecoreLinkType.External,
            }),
            SignUpLinkCheckboxText: mockSitecoreField('SignUpLinkCheckboxText'),
        },
        params: mockCustomisableParams,
        rendering: {},
    } as TSubscribeBlockProps);

const createStores = () => ({
    layoutStore: {
        sitePath: 'sitePath',
    },
    trackingStore: {
        trackHomepageAction: jest.fn(),
    },
    queryParamStore: { buildRedirectUrlQuery: jest.fn() },
    userStore: { onLogout: jest.fn() },
});

let props = resetMocks();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SubscribeBlock />', () => {
    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render when fields are NOT provided', () => {
        props.fields = undefined;

        const { container } = render(<SubscribeBlock {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<SubscribeBlock {...props} />);

        const textComponents = screen.getAllByTestId('text-component');

        expect(textComponents[0]).toHaveTextContent('Title');
        expect(textComponents[1]).toHaveTextContent('Description');
        expect(screen.getByTestId('router-link')).toHaveTextContent('SignUpLink');
        expect(screen.getByTestId('checkbox')).toHaveTextContent('SignUpLinkCheckboxText');

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            className: 'getCustomisableTitleClassName',
            tag: 'div',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            tag: 'div',
            className: 'subscribe-section__description',
        });
        expect(mockCheckboxProps).toHaveBeenCalledWith({
            small: true,
            tick: true,
            textRight: true,
            checked: false,
            onChange: expect.any(Function),
        });
    });

    it('should render without text components, router link and checkbox when fields are empty', () => {
        props.fields = {};

        render(<SubscribeBlock {...props} />);

        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
    });

    it('should call trackHomepageAction on handleBtnClick with value from fields', async () => {
        render(<SubscribeBlock {...props} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.StayInTheLoop, {
            location: 'Title',
            name: 'SignUpLink',
            destination: 'new-url',
        });
    });

    it('should call trackHomepageAction on handleBtnClick with default values when some fields are NOT provided', async () => {
        props.fields!.Title = undefined;
        props.fields!.SignUpLink!.value.text = '';

        render(<SubscribeBlock {...props} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.StayInTheLoop, {
            location: 'Stay in the loop',
            name: 'Sign up',
            destination: 'new-url',
        });
    });
});
