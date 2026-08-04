import React, { useEffect, useState } from 'react';
import Head from 'next/head';

import useStore from 'frontend/hooks/useStore';
import { getJsonString } from 'frontend/utils/string.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

interface ISchemaFields {
    Schema?: ISitecoreField<string>;
    schema?: string;
}

// Component to render rich results schema (https://jira.build.easyjet.com/browse/EJH-14249, https://jira.build.easyjet.com/browse/EUX-763)
const Schema = ({ fields }: ISitecoreComponent<ISchemaFields>) => {
    const { isHomePage } = useStore(stores => ({
        isHomePage: stores.layoutStore.isHomePage,
    }));

    // in sitecore Q&A schema components have a different content resolver
    const schemaValue = isHomePage ? fields?.Schema?.value : fields?.schema;

    const [jsonString, setJsonString] = useState(getJsonString(schemaValue));

    // on schema changes
    useEffect(() => {
        const jsonString = getJsonString(schemaValue);

        setJsonString(jsonString);
    }, [schemaValue]);

    if (!jsonString) {
        return null;
    }

    return (
        <Head key='schema'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: jsonString,
                }}
            />
        </Head>
    );
};

export default Schema;
