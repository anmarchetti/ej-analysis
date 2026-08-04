import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ActionCard, { IActionCardProps } from './ActionCard';

expect.extend(toHaveNoViolations);

const createProps = () => ({
    title: mockSitecoreField('Action'),
    description: mockSitecoreField('Your feedback means a lot to us.<br/> Leave a review of your hotel.'),
    icon: <div data-tid='icon' />,
    iconClassName: 'icon-class',
    descriptionClassName: 'description-class',
    children: <button data-tid='button'>button</button>,
    dataTid: 'action-card',
});

let props: IActionCardProps;

const mockRichTextWithLinksProps = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='description'>{props.field.value}</div>;
    },
}));

describe('<ActionCard />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render the component with title, icon, description and children', () => {
        render(<ActionCard {...props} />);

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.title.value);
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByTestId('description')).toBeInTheDocument();
        expect(screen.getByTestId('action-card')).toBeInTheDocument();
        expect(screen.getByTestId('action-card-title')).toBeInTheDocument();

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: props.description,
            className: expect.any(String),
            dataId: 'action-card-description',
        });
    });

    it('should NOT render icon when it is not passed', () => {
        props.icon = undefined;

        render(<ActionCard {...props} />);

        expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should NOT render description when it is not passed', () => {
        props.description = undefined;

        render(<ActionCard {...props} />);

        expect(screen.queryByTestId('description')).not.toBeInTheDocument();
        expect(mockRichTextWithLinksProps).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ActionCard {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
