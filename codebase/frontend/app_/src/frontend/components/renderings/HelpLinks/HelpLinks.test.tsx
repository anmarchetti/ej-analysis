import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { HelpLinksVariant } from 'models/enum/HelpLinksVariant';

import { helpLink1, helpLink2 } from './__mocks__/helpLink';
import { HelpLinks, THelpLinksProps } from './HelpLinks';

expect.extend(toHaveNoViolations);

const mockHelpLink = jest.fn();
jest.mock('./components/HelpLink', () => props => {
    mockHelpLink(props);

    return <div data-tid='help-link' />;
});

describe('<HelpLinks />', () => {
    const resetMocks = (): THelpLinksProps => ({
        fields: {
            Links: [helpLink1, helpLink2],
            Title: { value: 'Title' },
        },
        params: { Variant: '' as HelpLinksVariant },
        rendering: {},
    });

    let props;

    beforeEach(() => {
        props = resetMocks();
    });

    it('should NOT render component when NO fields', () => {
        delete props.fields;

        const { container } = render(<HelpLinks {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        render(<HelpLinks {...props} />);

        const el = screen.getByTestId('help-links');

        expect(el).toHaveClass('helpLinks');
        expect(el).not.toHaveClass('bordered');

        expect(screen.getByTestId('help-links-title')).toHaveTextContent(props.fields.Title.value);
        expect(mockHelpLink).toHaveBeenNthCalledWith(1, {
            Variant: '',
            ...props.fields.Links[0],
        });
        expect(mockHelpLink).toHaveBeenNthCalledWith(2, {
            Variant: '',
            ...props.fields.Links[1],
        });
        expect(screen.getAllByTestId('help-link')).toHaveLength(2);
    });

    it('should render bordered item when Variant is CardWithBorder', () => {
        props.params.Variant = HelpLinksVariant.CardWithBorder;

        render(<HelpLinks {...props} />);

        expect(screen.getByTestId('help-links')).toHaveClass('helpLinks bordered');
        expect(mockHelpLink).toHaveBeenNthCalledWith(1, {
            Variant: 'Card With Border',
            ...props.fields.Links[0],
        });
        expect(mockHelpLink).toHaveBeenNthCalledWith(2, {
            Variant: 'Card With Border',
            ...props.fields.Links[1],
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HelpLinks {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
