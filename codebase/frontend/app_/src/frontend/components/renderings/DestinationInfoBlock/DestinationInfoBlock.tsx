import React, { FunctionComponent, useCallback, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { TextPosition, TitleFontStyle } from 'models/enum/CustomisableComponentsParameters';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import InspireMePopup from 'frontend/components/common/InspireMeRopup/InspireMePopup';
import { TextBlock } from 'frontend/components/renderings/TextBlock';

import styles from './DestinationInfoBlock.module.scss';

interface IDestinationInfoBlocParameters {
    EnableSeoReadMoreText?: TSitecoreCheckboxValue;
}
interface IDestinationInfoBlockFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

const DestinationInfoBlock: FunctionComponent<
    ISitecoreComponent<IDestinationInfoBlockFields, IDestinationInfoBlocParameters>
> = props => {
    const { isTradePortal } = useStore((stores: TStores) => ({
        isTradePortal: stores.layoutStore.isTradePortal,
    }));
    const [needToKnowHeight, setNeedToKnowHeight] = useState<number>(0);

    const { fields, params, rendering } = props;

    const measuredRef = useCallback((ref: HTMLDivElement) => {
        if (!!ref) {
            setNeedToKnowHeight(ref?.scrollHeight ?? 0);
        }
    }, []);

    return (
        <div className={styles.destinationInfoBlock} data-tid='destination-info-block'>
            <div className={styles.wrapper}>
                <TextBlock
                    fields={fields}
                    params={{
                        TitleTag: 'h2',
                        TitlePosition: TextPosition.Left,
                        TitleFontStyle: TitleFontStyle.Rounded,
                        DescriptionPosition: TextPosition.Left,
                        EnableSeoReadMoreText: params?.EnableSeoReadMoreText,
                    }}
                    rendering
                    height={needToKnowHeight}
                />
                {!!rendering?.placeholders?.[PlaceholderNames.NeedToKnow]?.length && (
                    <Placeholder
                        name={PlaceholderNames.NeedToKnow}
                        containerRef={measuredRef}
                        rendering={rendering}
                        className={styles.needToKnow}
                    />
                )}
                {!isTradePortal && <InspireMePopup />}
            </div>
        </div>
    );
};

export default DestinationInfoBlock;
