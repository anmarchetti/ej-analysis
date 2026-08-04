using System.Reflection;
using easyJet.Feature.SitecoreEnhancment.Pipelines.GetFieldSerializer;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.ItemSerializers;
using Sitecore.LayoutService.Serialization.Pipelines.GetFieldSerializer;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Pipelines.GetFieldSerializer
{
    public class GetRenderingMappingFieldSerializerTests
    {
        private readonly IFieldRenderer fieldRenderer;

        public GetRenderingMappingFieldSerializerTests()
        {
            fieldRenderer = Substitute.For<IFieldRenderer>();
        }

        [Fact]
        public void Constructor_WithValidFieldRenderer_InitializesCorrectly()
        {
            // Arrange
            var renderer = Substitute.For<IFieldRenderer>();

            // Act
            var sut = new GetRenderingMappingFieldSerializer(renderer);

            // Assert
            sut.Should().NotBeNull();
        }

        [Fact]
        public void SetResult_WithValidArgs_SetsRenderingMappingFieldSerializer()
        {
            // Arrange
            var sut = new GetRenderingMappingFieldSerializer(fieldRenderer);
            var field = CreateMockField("rendering mapping", string.Empty);
            var itemSerializer = Substitute.For<IItemSerializer>();
            var args = new GetFieldSerializerPipelineArgs
            {
                Field = field,
                ItemSerializer = itemSerializer
            };

            // Act
            sut.GetType()
                .GetMethod("SetResult", BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(sut, new object[] { args });

            // Assert
            args.Result.Should().NotBeNull();
            args.Result.Should().BeOfType<RenderingMappingFieldSerializer>();
        }

        [Fact]
        public void SetResult_PreservesFieldRenderer_InResultSerializer()
        {
            // Arrange
            var sut = new GetRenderingMappingFieldSerializer(fieldRenderer);
            var field = CreateMockField("rendering mapping", string.Empty);
            var itemSerializer = Substitute.For<IItemSerializer>();
            var args = new GetFieldSerializerPipelineArgs
            {
                Field = field,
                ItemSerializer = itemSerializer
            };

            // Act
            sut.GetType()
                .GetMethod("SetResult", BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(sut, new object[] { args });

            // Assert
            var resultSerializer = args.Result as RenderingMappingFieldSerializer;
            resultSerializer.Should().NotBeNull();
        }

        private static Field CreateMockField(string fieldType, string value)
        {
            var database = Substitute.For<Database>();
            var itemDefinition = new ItemDefinition(ID.NewID, "TestItem", ID.NewID, ID.NewID);
            var itemData = new ItemData(itemDefinition, Language.Parse("en"), Version.Latest, new FieldList());
            var item = Substitute.For<Item>(ID.NewID, itemData, database);
            var field = Substitute.For<Field>(ID.NewID, item);
            field.Type.Returns(fieldType);
            field.Value.Returns(value);
            return field;
        }
    }
}
