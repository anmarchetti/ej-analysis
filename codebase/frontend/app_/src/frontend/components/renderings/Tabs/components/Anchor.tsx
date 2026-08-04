import { useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { getAnchorLabel } from './utils';

export type TAnchorFields = {
    Anchor: ISitecoreField<string>;
    Icon: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
};

export type TAnchorProps = {
    fields: TAnchorFields;
    isActive?: boolean;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
    reviews?: number;
};

const INDEX_NOT_PRESENTED_ELEMENT = -1;

const Anchor = ({ fields, reviews, isActive, onClick }: TAnchorProps) => {
    const { getPhrase, getFormattedNumber } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
    }));

    const { Anchor, Icon, Title } = fields;
    const label = Title.value;

    const isTokenizable = useMemo(() => label.indexOf(Tokens.Review) !== INDEX_NOT_PRESENTED_ELEMENT, [label]);

    const renderedLabel = useMemo(
        () => getAnchorLabel(getPhrase, getFormattedNumber, isTokenizable, reviews, label),
        [isTokenizable, reviews, label],
    );

    const className = classNames('anchor', isActive && 'anchor--active', isTokenizable && !reviews && 'd-none');

    return (
        <a href={`#${Anchor.value}`} className={className} onClick={onClick} data-tid='anchor-link'>
            {Icon?.value && <span dangerouslySetInnerHTML={{ __html: Icon.value }} />}
            {renderedLabel}
        </a>
    );
};

export default observer(Anchor);
