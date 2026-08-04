using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using Sitecore.Abstractions;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.GetFieldSerializer
{
    [ExcludeFromCodeCoverage]
    public class GetInternalLinkFieldSerializer : BaseGetFieldSerializer
    {
        private readonly BaseMediaManager baseMediaManager;

        public GetInternalLinkFieldSerializer(IFieldRenderer fieldRenderer, BaseMediaManager baseMediaManager)
            : base(fieldRenderer)
        {
            this.baseMediaManager = baseMediaManager;
        }

        /// <summary>
        /// Set internal link serializer.
        /// </summary>
        /// <param name="args">Get field serializer pipeline args.</param>
        protected override void SetResult(GetFieldSerializerPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            args.Result = new InternalLinkFieldSerializer(args.ItemSerializer, FieldRenderer, baseMediaManager);
        }
    }
}