using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.GetFieldSerializer
{
    [ExcludeFromCodeCoverage]
    public class GetGeneralLinkFieldSerializer : BaseGetFieldSerializer
    {
        public GetGeneralLinkFieldSerializer(IFieldRenderer fieldRenderer)
          : base(fieldRenderer)
        {
        }

        protected override void SetResult(GetFieldSerializerPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            args.Result = new GeneralLinkFieldSerializer(FieldRenderer);
        }
    }
}
