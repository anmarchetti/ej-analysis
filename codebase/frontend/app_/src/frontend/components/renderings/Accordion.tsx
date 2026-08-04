import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AccordionComponent from 'frontend/components/common/Accordion/Accordion';
import AccordionPanel from 'frontend/components/common/Accordion/AccordionPanel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IAccordionPanel {
    id: string;
    fields?: {
        Text: ISitecoreField<string>;
        Title: ISitecoreField<string>;
        isOpened: ISitecoreField<boolean>;
    };
}

interface IAccordionFields {
    items: IAccordionPanel[];
}

interface IAccordionParams {
    isMultiple: string;
}

export type TAccordionProps = ISitecoreComponent<IAccordionFields, IAccordionParams>;

const Accordion = (props: TAccordionProps) => {
    if (!props.fields?.items?.length) {
        return null;
    }

    const defaultOpenedPanlesIds = props.fields.items.filter(p => p.fields?.isOpened?.value).map(p => p.id);
    const isMultiple = props.params?.isMultiple ? !!+props.params.isMultiple : false;

    return (
        <AccordionComponent isMultiple={isMultiple} defaultOpenedPanelsIds={defaultOpenedPanlesIds}>
            {props.fields.items.map(item => (
                <AccordionPanel
                    key={item.id}
                    panelId={item.id}
                    title={!!item.fields?.Title && <Text field={item.fields.Title} tag='span' />}
                    content={!!item.fields?.Text && <RichTextWithLinks field={item.fields.Text} tag='div' />}
                />
            ))}
        </AccordionComponent>
    );
};

export default Accordion;
