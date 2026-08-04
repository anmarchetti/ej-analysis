import React, { FC, useState } from 'react';
import classnames from 'classnames';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';

import styles from './AttentionMessage.module.scss';

export enum AttentionMessageType {
    BlueWarning = 'Blue warning',
}

export interface IAttentionMessageFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    Link?: ISitecoreField<ISitecoreLink>;
    Type?: ISitecoreField<string>;
}

export interface IAttentionMessageRenderingParams {
    Type?: AttentionMessageType;
}

export interface IAttentionMessageSelfProps {
    className?: string;
    collapsible?: boolean;
    containerClassName?: string;
    isExpandedByDefault?: boolean;
    renderCustomMetaData?: (type?: string) => Partial<{
        fields: Partial<IAttentionMessageFields>;
        isExpandedByDefault: boolean;
        isVisible: boolean;
    }>;
    tokenizer?: {
        token: Tokens;
        value: string;
    };
}

export interface IAttentionMessageProps
    extends ISitecoreComponent<IAttentionMessageFields, IAttentionMessageRenderingParams>,
        IAttentionMessageSelfProps {}

const AttentionMessage: FC<IAttentionMessageProps> = ({
    fields,
    params,
    className,
    containerClassName,
    tokenizer,
    collapsible,
    isExpandedByDefault,
    renderCustomMetaData,
}) => {
    const {
        fields: customFields = {},
        isVisible = true,
        isExpandedByDefault: customDefaultExpanded = isExpandedByDefault,
    } = renderCustomMetaData?.(fields?.Type?.value) || {};

    const [expanded, setExpanded] = useState(!!customDefaultExpanded);

    const toggleExpand = (): void => {
        setExpanded(!expanded);
    };

    if (!fields || !isVisible) {
        return null;
    }

    const { Description, Link, Title, Icon } = { ...fields, ...customFields };
    const descriptionField = tokenizer
        ? { value: Tokenizer.replaceToken(Description?.value, tokenizer.token, tokenizer.value) }
        : Description;

    return (
        <div
            className={classnames(containerClassName, {
                [styles.attentionMessage]: true,
                [styles.collapsible]: collapsible,
                [styles.collapsed]: !expanded,
            })}
            data-tid='attention-message'
        >
            <InfoBlock
                title={Title}
                text={descriptionField}
                icon={Icon}
                className={classnames(styles.message, className, {
                    [styles.blueWarning]: params.Type === AttentionMessageType.BlueWarning,
                })}
                textClass={styles.description}
                link={Link}
                iconClass={styles.icon}
            />
            {collapsible && (
                <button
                    onClick={toggleExpand}
                    className={classnames({
                        [styles.expander]: true,
                    })}
                    data-tid='attention-message-expander'
                    aria-expanded={expanded}
                    aria-controls='attention-message'
                >
                    <SvgChevronDown />
                </button>
            )}
        </div>
    );
};

export default AttentionMessage;
