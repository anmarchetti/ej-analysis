using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using Sitecore.Abstractions;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;
using Sitecore.Services.GraphQL.EdgeSchema.Services.Multisite;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.GetFieldSerializer
{
    [ExcludeFromCodeCoverage]
    public class GetMultilistFieldSerializer : BaseGetFieldSerializer
    {
        private readonly BaseMediaManager baseMediaManager;
        private readonly IMultisiteService multisiteService;

        public GetMultilistFieldSerializer(IFieldRenderer fieldRenderer, BaseMediaManager baseMediaManager, IMultisiteService multisiteService)
            : base(fieldRenderer)
        {
            this.baseMediaManager = baseMediaManager;
            this.multisiteService = multisiteService;
        }

        /// <summary>
        /// Set multilist serializer.
        /// </summary>
        /// <param name="args">Get field serializer pipeline args.</param>
        protected override void SetResult(GetFieldSerializerPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Field, $"{nameof(args.Field)} is null");
            Assert.IsNotNull(args.ItemSerializer, $"{nameof(args.ItemSerializer)} is null");

            args.Result = new MultilistFieldSerializer(args.ItemSerializer, FieldRenderer, baseMediaManager, multisiteService);
        }
    }
}