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
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Pipelines.GetFieldSerializer
{
    public class GetInternalLinkFieldSerializerTests
    {
        private readonly IFieldRenderer fieldRenderer;
        private readonly IItemSerializer itemSerializer;
        private readonly BaseMediaManager baseMediaManager;
        private readonly GetInternalLinkFieldSerializer getInternalLinkFieldSerializer;

        public GetInternalLinkFieldSerializerTests()
        {
            fieldRenderer = Substitute.For<IFieldRenderer>();
            itemSerializer = Substitute.For<IItemSerializer>();
            baseMediaManager = Substitute.For<BaseMediaManager>();
            getInternalLinkFieldSerializer = new GetInternalLinkFieldSerializer(fieldRenderer, baseMediaManager);
        }

        [Theory]
        [AutoData]
        public void GetInternalLinkFieldSerializer_ResultShouldNotBeNull_IfArgsNotNulll(Db db, ID fieldId)
        {
            // Arrange
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId) { Type = "InternalLinkField", Value = dbItem.FullPath });

            var targetDbItem = new DbItem("Target item");
            targetDbItem.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeValue" });

            db.Add(dbItem);
            db.Add(targetDbItem);

            var item = db.GetItem(dbItem.ID);

            var args = new GetFieldSerializerPipelineArgs();
            args.Field = item.Fields["FakeField"];
            args.ItemSerializer = itemSerializer;
            args.ProcessorItem = item;

            // Act
            getInternalLinkFieldSerializer.GetType().GetMethod("SetResult", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(getInternalLinkFieldSerializer, new object[] { args });

            // Assert
            args.Result.Should().NotBeNull();
        }
    }
}
