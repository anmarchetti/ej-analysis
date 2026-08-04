import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IDestination } from 'models/data/IDestination';
import { IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IDynamicPromoTextBlockFields {
    HotelTheme: ISitecoreCompositeField<IHotelThemeFields>;
    HotelThemeType: ISitecoreCompositeField<IHotelThemeTypeFields>[];
    Name: ISitecoreField<string>;
    PageDescription: ISitecoreField<string>;
}

interface IDynamicPromoTextBlockProps extends ISitecoreComponent<IDynamicPromoTextBlockFields> {
    destination: Nullable<IDestination>;
}

@observer
export class DynamicPromoTextBlock extends React.Component<IDynamicPromoTextBlockProps> {
    get themeTitle(): string {
        return this.props.fields?.HotelTheme?.fields?.DestinationGuideTitle?.value || '';
    }

    get typeTitle(): string {
        const types = this.props.fields?.HotelThemeType;

        return types && types?.length > 0 ? types[0].fields?.DestinationGuideTitle?.value || '' : '';
    }

    get title(): string {
        const pageName = this.props.fields?.Name?.value;

        return Tokenizer.replaceTokens(pageName, {
            [Tokens.HolidayTheme]: this.typeTitle || this.themeTitle,
            [Tokens.DestinationName]: this.props.destination?.name || '',
        });
    }

    get description(): string {
        const text = this.props.fields?.PageDescription?.value;

        return Tokenizer.replaceTokens(text, {
            [Tokens.HolidayType]: this.typeTitle.toLowerCase(),
            [Tokens.HolidayTheme]: this.themeTitle.toLowerCase(),
            [Tokens.DestinationType]: (this.props.destination?.type || '').toLowerCase(),
            [Tokens.DestinationName]: this.props.destination?.name || '',
        });
    }

    render() {
        const { fields } = this.props;

        if (!fields) {
            return null;
        }

        return (
            <div className='text-block'>
                <h1 className='text-block__header text-block__header--rounded'>{this.title}</h1>
                <div className='text-block__description'>{this.description}</div>
            </div>
        );
    }
}

const ConnectedDynamicPromoTextBlock = inject((stores: TStores) => ({
    destination: stores.promoPageStore.pageDestination,
}))(DynamicPromoTextBlock);

export default ConnectedDynamicPromoTextBlock;
