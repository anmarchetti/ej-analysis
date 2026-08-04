import * as React from 'react';
import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

import AccordionPanel, { IAccordionPanelProps } from './AccordionPanel';

type TAccordionPanelElement = React.ReactElement<IAccordionPanelProps, typeof AccordionPanel>;

export interface IAccordionProps {
    children?: TAccordionPanelElement[] | TAccordionPanelElement;
    className?: string;
    defaultOpenedPanelsIds?: string[];
    isMultiple?: boolean;
}

@observer
export class Accordion extends React.Component<IAccordionProps> {
    constructor(props: IAccordionProps) {
        super(props);
        makeObservable(this);
    }

    @observable openedPanelsIds: string[] = [];

    componentDidMount(): void {
        (this.props.defaultOpenedPanelsIds || []).forEach(id => this.onTogglePanel(id));
    }

    @action onTogglePanel = (panelId: string): void => {
        const index = this.openedPanelsIds.findIndex(id => panelId === id);

        if (index === -1) {
            // If accordion isn't  multiple, only one panel can be opened at the same time.
            this.props.isMultiple ? this.openedPanelsIds.push(panelId) : (this.openedPanelsIds = [panelId]);
        } else {
            this.openedPanelsIds.splice(index, 1);
        }
    };

    isPanelOpened = (panelId: string): boolean => this.openedPanelsIds.includes(panelId);

    renderPanel = (panel: TAccordionPanelElement): React.ReactNode => {
        if (!panel || panel.type?.name !== AccordionPanel.name) return null;

        const { panelId, onTogglePanel } = panel.props;

        return React.cloneElement(panel, {
            isOpened: this.isPanelOpened(panel.props.panelId),
            onTogglePanel: () => {
                this.onTogglePanel(panelId);
                onTogglePanel?.();
            },
        });
    };

    render(): React.ReactNode {
        if (!this.props.children) return null;

        return (
            <div className={classNames('accordion', this.props.className)}>
                {React.Children.map(this.props.children, this.renderPanel)}
            </div>
        );
    }
}

export default Accordion;
