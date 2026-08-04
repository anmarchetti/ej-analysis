import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Accordion } from './Accordion';
import AccordionPanel from './AccordionPanel';

describe('Accordion', () => {
    const renderAccordionWithPanels = (props?: any) =>
        render(
            <Accordion {...props}>
                <AccordionPanel panelId='test-1' title='test' content='test' />
                <AccordionPanel panelId='test-2' title='test' content='test' />
            </Accordion>,
        );

    it('should be empty if there are not children', () => {
        const { container } = render(<Accordion />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should not render panel if child is not AccordionPanel', () => {
        render(
            <Accordion>
                <div>test-1</div>
            </Accordion>,
        );

        expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should render accordion panels with extended props', () => {
        const { container } = renderAccordionWithPanels({ defaultOpenedPanelsIds: ['test-1'] });

        const panels = screen.getAllByText('test');
        expect(container.querySelector('.accordion')).toBeTruthy();
        expect(panels).toHaveLength(4);

        expect(container.innerHTML).toContain('test');
        expect(container.innerHTML).toContain('test');
    });

    it('should be opened several panels at the same time if multiple is true', () => {
        const { getAllByText } = renderAccordionWithPanels({ isMultiple: true });

        const titles = getAllByText('test');
        fireEvent.click(titles[0]);
        fireEvent.click(titles[1]);

        expect(screen.getAllByText('test')).toHaveLength(4);
    });

    it('should be opened only one panel at the same time if multiple is false', () => {
        const { getAllByText, queryAllByText } = renderAccordionWithPanels({ isMultiple: false });

        const titles = getAllByText('test');
        fireEvent.click(titles[0]);
        expect(queryAllByText('test')).toHaveLength(4);

        fireEvent.click(titles[1]);
        expect(queryAllByText('test')).toHaveLength(4);
    });

    it('should toggle panel and call custom event', () => {
        const customToggleMock = jest.fn();
        render(
            <Accordion>
                <AccordionPanel panelId='test-1' title='test' content='test' onTogglePanel={customToggleMock} />
            </Accordion>,
        );

        const title = screen.getAllByText('test')[0];
        fireEvent.click(title);
        fireEvent.click(title);

        expect(customToggleMock).toHaveBeenCalledTimes(2);
    });
});
