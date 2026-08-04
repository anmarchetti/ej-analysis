using System.Collections.Generic;
using easyJet.Feature.PageContent.Pipelines.Arguments;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;

namespace easyJet.Feature.PageContent.Tests.Pipelines.TransparentFolder
{
    public class RemoveTransparentFolderFromUrlProcessorTestData
    {
        public static IEnumerable<object[]> InvalidArgsForProcess()
        {
            yield return new object[] { null };

            yield return new object[] { new GetItemUrlPipelineArgs() { Url = null } };

            yield return new object[] { new GetItemUrlPipelineArgs() { Url = string.Empty } };
        }

        public static IEnumerable<object[]> ValidArgsWithUrlStartingWithDoubleSlash()
        {
            var item = GetItemForArgs(out var rootName, out var folderName, out var childName);

            yield return new object[]
            {
                new GetItemUrlPipelineArgs()
                {
                    Item = item,
                    Url = $"//{rootName}/{folderName}/{childName}",
                },
                $"//{rootName}/{childName}"
            };

            yield return new object[]
            {
                new GetItemUrlPipelineArgs()
                {
                    Item = item,
                    Url = $"://{rootName}/{folderName}/{childName}",
                },
                $"://{rootName}/{childName}"
            };
        }

        public static IEnumerable<object[]> ValidArgsWithUrlStartingWithSingleSlash()
        {
            var item = GetItemForArgs(out var rootName, out var folderName, out var childName);

            yield return new object[]
            {
                new GetItemUrlPipelineArgs()
                {
                    Item = item,
                    Url = $"/{rootName}/{folderName}/{childName}"
                },
                $"/{rootName}/{childName}"
            };
        }

        public static Item GetItemForArgs(out string rootName, out string folderName, out string childName, int folderTransparency = 1)
        {
            rootName = "testRoot";
            folderName = "transparentChildFolder";
            var childItemID = ID.NewID;
            childName = "actualChildElement";
            var db = new Db()
            {
                new DbItem(rootName)
                {
                    new DbItem(folderName)
                    {
                        Fields = { { Constants.Fields.TransparentFolder.TransparentItem, $"{folderTransparency}" } },
                        Children = { new DbItem(childName, childItemID) }
                    }
                }
            };
            var item = db.GetItem(childItemID);
            return item;
        }
    }
}