using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using NSubstitute;
using Sitecore.LayoutService.Serialization;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldSerializers
{
    public class StrippingRichTextFieldSerializerTests
    {
        private readonly IFieldRenderer fieldRenderer;
        private readonly StrippingRichTextFieldSerializer sut;

        public StrippingRichTextFieldSerializerTests()
        {
            fieldRenderer = Substitute.For<IFieldRenderer>();
            sut = new StrippingRichTextFieldSerializer(fieldRenderer, new[] { "li", "ul", "ol", "p", "strong", "b", "em", "i" });
        }
    }
}
