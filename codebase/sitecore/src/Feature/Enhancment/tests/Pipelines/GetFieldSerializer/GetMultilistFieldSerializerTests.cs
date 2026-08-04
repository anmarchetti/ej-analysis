using System.Linq;
using System.Reflection;
using AutoFixture.Xunit2;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.ItemSerializers;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;
using Sitecore.Services.GraphQL.EdgeSchema.Services.Multisite;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Pipelines.GetFieldSerializer
{
    public class GetMultilistFieldSerializerTests
    {
        private readonly IFieldRenderer fieldRenderer;
        private readonly IItemSerializer itemSerializer;
        private readonly BaseMediaManager baseMediaManager;
        private readonly GetMultilistFieldSerializer getMultilistFieldSerializer;
        private readonly IMultisiteService multisiteService;

        public GetMultilistFieldSerializerTests()
        {
            fieldRenderer = Substitute.For<IFieldRenderer>();
            itemSerializer = Substitute.For<IItemSerializer>();
            baseMediaManager = Substitute.For<BaseMediaManager>();
            multisiteService = Substitute.For<IMultisiteService>();
            getMultilistFieldSerializer = new GetMultilistFieldSerializer(fieldRenderer, baseMediaManager, multisiteService);
        }

        [Theory]
        [AutoData]
        public void GetMultilistFieldSerializer_ResultShouldNotBeNull_IfArgsNotNull(Db db, ID fieldId)
        {
            // Arrange
            var targetDbItem = new DbItem("Target item");
            targetDbItem.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeValue" });
            db.Add(targetDbItem);

            var items = new DbItem[] { targetDbItem };

            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId) { Type = "MultilistField", Value = string.Join("|", items.Select(x => x.ID.Guid.ToString())) });
            db.Add(dbItem);

            var item = db.GetItem(dbItem.ID);

            var args = new GetFieldSerializerPipelineArgs();
            args.Field = item.Fields["FakeField"];
            args.ItemSerializer = itemSerializer;
            args.ProcessorItem = item;

            // Act
            getMultilistFieldSerializer.GetType().GetMethod("SetResult", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(getMultilistFieldSerializer, new object[] { args });

            // Assert
            args.Result.Should().NotBeNull();
        }
    }
}
