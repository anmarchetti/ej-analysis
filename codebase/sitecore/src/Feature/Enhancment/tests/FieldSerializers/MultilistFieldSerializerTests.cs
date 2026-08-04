using System.IO;
using System.Linq;
using System.Text;
using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyjet.Foundation.Testing.Attributes;
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
using Sitecore.Services.GraphQL.EdgeSchema.Services.Multisite;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldSerializers
{
    public class MultilistFieldSerializerTests
    {
        private readonly IItemSerializer itemSerializer;
        private readonly IFieldRenderer fieldRenderer;
        private readonly BaseMediaManager baseMediaManager;
        private readonly MultilistFieldSerializer multilistFieldSerializer;
        private readonly IMultisiteService multisiteService;

        public MultilistFieldSerializerTests()
        {
            itemSerializer = Substitute.For<IItemSerializer>();
            fieldRenderer = Substitute.For<IFieldRenderer>();
            baseMediaManager = Substitute.For<BaseMediaManager>();
            multisiteService = Substitute.For<IMultisiteService>();
            multilistFieldSerializer = new MultilistFieldSerializer(itemSerializer, fieldRenderer, baseMediaManager, multisiteService);
        }

        [Theory]
        [AutoDbData]
        public void MultilistFieldSerializer_ShouldReturnSerializedFieldInJSON_IfMultilistFieldIsValid(Db db, ID fieldId)
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

                var items = new DbItem[] { targetDbItem };
                var item = db.GetItem(dbItem.ID);

                item.Editing.BeginEdit();
                MultilistField multilistField = new MultilistField(item.Fields["FakeField"]) { Value = string.Join("|", items.Select(x => x.ID.Guid.ToString())) };
                item.Editing.EndEdit();

                var result = new StringBuilder(string.Empty);
                var data = string.Join(",", items.Select(x => $"{{\"id\":\"{x.ID.Guid}\",\"url\":\"{db.GetItem(x.ID).GetItemUrl()}\",\"fields\":}}"));
                string expected = $"\"{multilistField.InnerField.Name}\":[{data}]";

                using (StringWriter stringWriter = new StringWriter(result))
                using (JsonTextWriter jsonWriter = new JsonTextWriter(stringWriter))
                {
                    // Act
                    multilistFieldSerializer.Serialize(multilistField.InnerField, jsonWriter);
                }

                // Assert
                result.ToString().Should().Be(expected);
            }
        }

        [Theory]
        [AutoData]
        public void MultilistFieldSerializer_ShouldReturnNull_IfMultilistFieldDoNotHaveTargetItems(Db db, ID fieldId)
        {
            // Arrange
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId));

            db.Add(dbItem);

            var item = db.GetItem(dbItem.ID);

            item.Editing.BeginEdit();
            MultilistField multilistField = new MultilistField(item.Fields["FakeField"]);
            item.Editing.EndEdit();

            var result = new StringBuilder(string.Empty);
            string expected = $"\"{multilistField.InnerField.Name}\":[]";

            using (StringWriter stringWriter = new StringWriter(result))
            using (JsonTextWriter jsonWriter = new JsonTextWriter(stringWriter))
            {
                // Act
                multilistFieldSerializer.Serialize(multilistField.InnerField, jsonWriter);
            }

            // Assert
            result.ToString().Should().Be(expected);
        }
    }
}
