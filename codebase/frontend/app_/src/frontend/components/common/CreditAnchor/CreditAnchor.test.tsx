import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { CreditAnchor, ICreditAnchorFields } from './CreditAnchor';

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => url),
    },
}));

const createProps = () => ({
    fields: {
        CreditText: { value: 'text' },
        CreditLink: { value: { text: 'link', href: 'link' } },
        CreditIcon: { value: { src: 'image ' } },
        DisableCreditAnchor: { value: false },
    } as ICreditAnchorFields,
    isPillStyle: false,
    isEditMode: false,
});

const createStores = () => ({
    trackingStore: {
        trackHomepageAction: jest.fn(),
    },
    layoutStore: {
        isEditMode: false,
        sitePath: 'sitePath',
    },
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <div className={props.className} onClick={props.onClick}>
                RouterLink
                <span>{props.children}</span>
            </div>
        );
    },
}));

describe('<CreditAnchor />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when fields are NOT provided', () => {
        delete props.fields;

        const { container } = render(<CreditAnchor {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when DisableCreditAnchor is true', () => {
        props.fields.DisableCreditAnchor.value = true;

        const { container } = render(<CreditAnchor {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when all fields are empty and is NOT edit mode', () => {
        props.isEditMode = false;
        props.fields = {
            CreditText: { value: '' },
            CreditLink: { value: { text: '', href: '' } },
            CreditIcon: { value: { src: '' } },
            DisableCreditAnchor: { value: false },
        };

        const { container } = render(<CreditAnchor {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should be default render (content wrapped in RouterLink)', () => {
        const { container, getByText } = render(<CreditAnchor {...props} />);

        expect(container.querySelector('.credit-anchor--pill')).not.toBeInTheDocument();
        expect(getByText('RouterLink')).toBeInTheDocument();
        expect(getByText('link')).toBeInTheDocument();
        expect(container.querySelector('.credit-anchor__icon')).toBeInTheDocument();
    });

    it('Should wrap content in div if there is NO CreditLink', () => {
        props.fields.CreditLink = null as any;
        const { getByText, container } = render(<CreditAnchor {...props} />);

        expect(getByText('text')).toBeInTheDocument();
        expect(container.querySelector('.credit-anchor__icon')).toBeInTheDocument();
    });

    it('Should render only icon', () => {
        props.fields.CreditLink = null as any;
        props.fields.CreditText = null as any;
        const { container } = render(<CreditAnchor {...props} />);

        expect(container.querySelector('.credit-anchor')).toHaveTextContent('');
        expect(container.querySelector('.credit-anchor__icon')).toBeInTheDocument();
    });

    it('Should be styles as pill', () => {
        props.isPillStyle = true;
        const { container } = render(<CreditAnchor {...props} />);

        expect(container.querySelector('.credit-anchor--pill')).toBeInTheDocument();
    });

    it('should handle click event', () => {
        const { getByText } = render(<CreditAnchor {...props} />);

        const routerLink = getByText('RouterLink');
        expect(routerLink).toBeInTheDocument();

        fireEvent.click(routerLink);
        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalled();
    });

    it('should render plain text', () => {
        props.fields.CreditLink.value.href = '';
        const { getByText } = render(<CreditAnchor {...props} />);

        expect(getByText('text')).toBeInTheDocument();

        fireEvent.click(getByText('text'));
        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalled();
    });

    it('should render credit text', () => {
        props.fields.CreditLink.value.text = '';
        const { getByText } = render(<CreditAnchor {...props} />);

        expect(getByText('text')).toBeInTheDocument();

        fireEvent.click(getByText('text'));
        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalled();
    });

    it('should NOT invoke trackHomepageAction', () => {
        const { getByText } = render(<CreditAnchor {...props} isHomepageBannerElement={false} />);

        expect(getByText('RouterLink')).toBeInTheDocument();

        fireEvent.click(getByText('RouterLink'));
        expect(mockStores.trackingStore.trackHomepageAction).not.toHaveBeenCalled();
    });

    it('should add passed className', () => {
        props.className = 'test';
        render(<CreditAnchor {...props} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith(expect.objectContaining({ className: 'credit-anchor test' }));
    });
});
