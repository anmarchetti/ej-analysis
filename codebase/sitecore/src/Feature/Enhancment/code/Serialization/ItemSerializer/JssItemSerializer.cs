using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;

namespace easyJet.Feature.SitecoreEnhancment.Serialization.ItemSerializer
{
    [ExcludeFromCodeCoverage]
    public class JssItemSerializer : Sitecore.JavaScriptServices.ViewEngine.LayoutService.JssItemSerializer
    {
        private readonly HashSet<string> excludedFieldNames;

        public JssItemSerializer(IGetFieldSerializerPipeline getFieldSerializerPipeline, BaseSettings settings)
            : base(getFieldSerializerPipeline)
        {
            excludedFieldNames = settings.GetSetting(Constants.Settings.ExcludedFieldNamesSettingName)?.Split(new[] { ",", "|", ";" }, StringSplitOptions.RemoveEmptyEntries).ToHashSet() ?? new HashSet<string>();
        }

        protected override bool FieldFilter(Field field)
        {
            return base.FieldFilter(field) && !excludedFieldNames.Contains(field.Name);
        }
    }
}