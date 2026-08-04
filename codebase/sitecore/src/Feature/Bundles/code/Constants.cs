using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Feature.Bundles
{
    [ExcludeFromCodeCoverage]
    public struct Constants
    {
        public static class ItemNames
        {
            public static readonly string Settings = "Settings";
            public static readonly string Data = "Data";
        }

        public static class FieldNames
        {
            public static class BundleGroup
            {
                public static readonly string Promocode = "Promocode";
                public static readonly string Bundles = "Bundles";
            }

            public static class BundleDefinition
            {
                public static readonly string Name = "Name";
                public static readonly string Description = "Description";
                public static readonly string BundleDefinitionIcon = "BundleDefinitionIcon";
            }

            public static class BundleElement
            {
                public static readonly string Identifier = "Identifier";
                public static readonly string BundleElementIcon = "BundleElementIcon";
            }

            public static class Icon
            {
                public static readonly string Identifier = "Identifier";
            }

            public static readonly string BundlesDatasourceField = "Bundle Data";
        }

        public static class TemplateIds
        {
            public static readonly ID BundleGroupFolder = ID.Parse("{dfb4c0d8-d75b-441d-b4ab-7b753b4d54e0}");
            public static readonly ID BundleDefinitionFolder = ID.Parse("{a3c3db9f-7f38-4ef2-ac7b-84428d617449}");
            public static readonly ID BundleElementFolder = ID.Parse("{7a6911ff-2538-474d-8ba4-ca3d8f5eea41}");
            public static readonly ID BundleIconFolder = ID.Parse("{9A74FF1E-8EA1-499E-8005-1D192ADD4DE9}");
            public static readonly ID Website = ID.Parse("{9234E4D3-DC9F-4942-9192-11F7E41AA8D7}");
            public static readonly ID BundleGroup = ID.Parse("{47C3201B-CD00-4EE2-8DD3-18492B4211B6}");
        }

        public static readonly IImmutableSet<ID> BundlesFolderTemplates =
            ImmutableHashSet.Create(
                TemplateIds.BundleGroupFolder,
                TemplateIds.BundleDefinitionFolder,
                TemplateIds.BundleElementFolder,
                TemplateIds.BundleIconFolder);
    }
}
