using System.Collections.Generic;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.Bundles.Tests
{
    public class ItemFactory
    {
        public static Item CreateFakeItem(ID templateId = null, Dictionary<string, string> fields = null)
        {
            var id = ID.NewID;

            var fieldList = new FieldList();
            if (fields != null)
            {
                foreach (var f in fields)
                {
                    var fieldId = ID.NewID;
                    fieldList.Add(fieldId, f.Value);
                }
            }

            var itemDefinition = new ItemDefinition(id, "fake", templateId ?? ID.NewID, ID.NewID);
            var itemData = new ItemData(itemDefinition, Language.Parse("en"), Version.First, fieldList);
            var database = Substitute.For<Database>();

            var item = Substitute.For<Item>(id, itemData, database);
            item.Language.Returns(Language.Parse("en"));
            item.TemplateID.Returns(templateId ?? ID.NewID);
            var field = Substitute.For<Field>(ID.NewID, item);
            if (fields != null)
            {
                item[Constants.FieldNames.BundleGroup.Promocode].Returns(fields[Constants.FieldNames.BundleGroup.Promocode]);
                field.Value.Returns(fields[Constants.FieldNames.BundleGroup.Bundles]);
            }

            var fieldCollection = Substitute.For<FieldCollection>(item);
            fieldCollection[Constants.FieldNames.BundleGroup.Bundles].Returns(field);
            item.Fields.Returns(fieldCollection);

            var itemPaths = Substitute.For<ItemPath>(item);
            itemPaths.FullPath.Returns("/sitecore");
            item.Paths.Returns(itemPaths);

            var itemAxes = Substitute.For<ItemAxes>(item);
            item.Axes.Returns(itemAxes);

            return item;
        }
    }
}