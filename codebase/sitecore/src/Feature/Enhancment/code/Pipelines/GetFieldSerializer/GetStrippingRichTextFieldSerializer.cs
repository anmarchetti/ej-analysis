using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using Sitecore.Data;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.FieldSerializers;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.GetFieldSerializer
{
    [ExcludeFromCodeCoverage]
    public class GetStrippingRichTextFieldSerializer : BaseGetFieldSerializer
    {
        private static readonly Dictionary<ID, string[]> FieldAllowedTags = new Dictionary<ID, string[]>()
        {
            {
                Constants.FieldIds.BoardDescriptionContent, new[]
                {
                    "li",
                    "ul",
                    "ol",
                    "p",
                    "strong",
                    "b",
                    "em",
                    "i"
                }
            }
        };

        public GetStrippingRichTextFieldSerializer(IFieldRenderer fieldRenderer)
            : base(fieldRenderer)
        {
        }

        protected override void SetResult(GetFieldSerializerPipelineArgs args)
        {
            Assert.ArgumentNotNull((object)args, nameof(args));
            if (FieldAllowedTags.TryGetValue(args.Field.ID, out var tags))
            {
                args.Result = new StrippingRichTextFieldSerializer(FieldRenderer, tags);
            }
            else
            {
                args.Result = new RichTextFieldSerializer(FieldRenderer);
            }
        }
    }
}
