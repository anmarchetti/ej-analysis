using System.IO;
using System.Text;
using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Serialization;
using Sitecore.LayoutService.Serialization.ItemSerializers;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldSerializers
{
    public class InternalLinkFieldSerializerTests
    {
        private readonly IItemSerializer itemSerializer;
        private readonly IFieldRenderer fieldRenderer;
        private readonly BaseMediaManager baseMediaManager;
        private readonly InternalLinkFieldSerializer internalLinkFieldSerializer;

        public InternalLinkFieldSerializerTests()
        {
            itemSerializer = Substitute.For<IItemSerializer>();
            fieldRenderer = Substitute.For<IFieldRenderer>();
            baseMediaManager = Substitute.For<BaseMediaManager>();
            internalLinkFieldSerializer = new InternalLinkFieldSerializer(itemSerializer, fieldRenderer, baseMediaManager);
        }

        [Theory]
        [AutoData]
        public void InternalLinkFieldSerializer_ShouldReturnSerializedFieldInJSON_IfInternalLinkFieldIsValid(Db db, ID fieldId)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
              new StringDictionary
              {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
              });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var dbItem = new DbItem("Fake");
                dbItem.Fields.Add(new DbField("FakeField", fieldId));

                var targetDbItem = new DbItem("Target item");
                targetDbItem.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeValue" });

                db.Add(dbItem);
                db.Add(targetDbItem);

                var item = db.GetItem(dbItem.ID);

                item.Editing.BeginEdit();
                InternalLinkField internalLinkField = new InternalLinkField(item.Fields["FakeField"]) { Path = db.GetItem(targetDbItem.ID).Paths.FullPath };
                item.Editing.EndEdit();

                var result = new StringBuilder(string.Empty);
                string expected = $"\"{internalLinkField.InnerField.Name}\":{{\"id\":\"{targetDbItem.ID.Guid}\",\"url\":\"{db.GetItem(targetDbItem.ID).GetItemUrl()}\",\"fields\":}}";

                using (StringWriter stringWriter = new StringWriter(result))
                using (JsonTextWriter jsonWriter = new JsonTextWriter(stringWriter))
                {
                    // Act
                    internalLinkFieldSerializer.Serialize(internalLinkField.InnerField, jsonWriter);
                }

                // Assert
                result.ToString().Should().Be(expected);
            }
        }

        [Theory]
        [AutoData]
        public void InternalLinkFieldSerializer_ShouldReturnNull_IfInternalLinkFieldDoNotHaveTargetItem(Db db, ID fieldId)
        {
            // Arrange
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId));

            var targetDbItem = new DbItem("Target item");
            targetDbItem.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeValue" });

            db.Add(dbItem);
            db.Add(targetDbItem);

            var item = db.GetItem(dbItem.ID);

            item.Editing.BeginEdit();
            InternalLinkField internalLinkField = new InternalLinkField(item.Fields["FakeField"]);
            item.Editing.EndEdit();

            var result = new StringBuilder(string.Empty);
            string expected = $"\"{internalLinkField.InnerField.Name}\":null";

            using (StringWriter stringWriter = new StringWriter(result))
            using (JsonTextWriter jsonWriter = new JsonTextWriter(stringWriter))
            {
                // Act
                internalLinkFieldSerializer.Serialize(internalLinkField.InnerField, jsonWriter);
            }

            // Assert
            result.ToString().Should().Be(expected);
        }
    }
}
