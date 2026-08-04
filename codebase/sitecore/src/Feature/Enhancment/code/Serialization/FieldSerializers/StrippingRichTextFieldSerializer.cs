using System.Diagnostics.CodeAnalysis;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.Data.Fields;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.FieldSerializers;

namespace easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers
{
    [ExcludeFromCodeCoverage]
    public class StrippingRichTextFieldSerializer : BaseFieldSerializer
    {
        private readonly string[] allowedTags;

        public StrippingRichTextFieldSerializer(IFieldRenderer fieldRenderer, string[] allowedTags)
            : base(fieldRenderer)
        {
            this.allowedTags = allowedTags;
        }

        protected override void WriteValue(Field field, JsonTextWriter writer)
        {
            Assert.ArgumentNotNull((object)field, nameof(field));
            Assert.ArgumentNotNull((object)writer, nameof(writer));
            var fieldRendererResult = RenderField(field, true);
            writer.WriteValue(fieldRendererResult.ToString().StripHtml(allowedTags));
        }
    }
}
