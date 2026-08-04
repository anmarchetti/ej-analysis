using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using easyJet.Feature.PageContent.Pipelines.TransparentFolder;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class GetItemUrlTestBase
    {
        protected readonly StandardItemResolver standardItemResolver;
        protected readonly StandardPathToItemResolver standardPathToItemResolver;
        protected readonly StandardCreateResolveItemResultProcessor standardCreateResolveItemResultProcessor;
        protected readonly StandardValidatorResultProcessor standardValidatorResultProcessor;
        protected readonly StandardItemValidator standardItemValidator;
        protected readonly ResolveTransparentFolderProcessor resolveTransparentFolderProcessor;
        protected readonly Fixture fixture;
        protected readonly Db db;

        public GetItemUrlTestBase()
        {
            // Arrange
            fixture = new Fixture();
            db = new Db();
            standardItemResolver = new StandardItemResolver();
            resolveTransparentFolderProcessor = new ResolveTransparentFolderProcessor();
            standardPathToItemResolver = Substitute.ForPartsOf<StandardPathToItemResolver>();
            standardCreateResolveItemResultProcessor = new StandardCreateResolveItemResultProcessor();
            standardValidatorResultProcessor = new StandardValidatorResultProcessor();
            standardItemValidator = new StandardItemValidator();
        }

        protected static FakeSiteContext CreateFakeSite()
        {
            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" },
                    { "startItem", "/Home" }
                });
            return fakeSite;
        }

        protected void CreateItemTree(List<DtoItem> items)
        {
            var itemsCreated = new List<DbItem>();
            for (var i = 0; i < items.Count; i++)
            {
                var item = items[i];
                var createdItem = new DbItem(item.Name, ID.Parse(item.Id));
                if (item.IsTransparentItem)
                {
                    var transparentFolderField = new DbField(Constants.Fields.TransparentFolder.TransparentItem)
                    {
                        Value = "1"
                    };
                    createdItem.Add(transparentFolderField);
                }

                itemsCreated.Add(createdItem);
                if (i <= 0)
                {
                    continue;
                }

                var parentItem = itemsCreated[i - 1];
                parentItem.Add(createdItem);
            }

            var firstItem = itemsCreated.First();
            db.Add(firstItem);
        }

        protected Item ProcessItemWrapper(string path, FakeSiteContext fakeSite, string idNeedsToBeResolved)
        {
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en")
            };
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                standardItemResolver.Process(args);
                return args.Item;
            }
        }

        protected void RegisterPipelines()
        {
            var resolvePathToItemProcessors = Substitute.For<IPipelineProcessor>();
            resolvePathToItemProcessors.When(p => p.Process(Arg.Any<ResolvePathToItemArgs>()))
                .Do(ci => ci.Arg<ResolvePathToItemArgs>().Result = GetResolvePathToItemResult(ci.Args()));

            db.PipelineWatcher.Register(Constants.Pipelines.ResolvePathToItem.Name, resolvePathToItemProcessors);

            var createResolveItemResultProcessors = Substitute.For<IPipelineProcessor>();
            createResolveItemResultProcessors.When(p => p.Process(Arg.Any<CreateResolveItemResultArgs>()))
                .Do(ci => ci.Arg<CreateResolveItemResultArgs>().Result = GetCreateResolveItemResult(ci.Args()));
            db.PipelineWatcher.Register(Constants.Pipelines.ResolvePathToItem.CreateResolveItemResult, createResolveItemResultProcessors);

            var isValidItemProcessors = Substitute.For<IPipelineProcessor>();
            isValidItemProcessors.When(p => p.Process(Arg.Any<IsValidItemArgs>()))
                .Do(ci => ci.Arg<IsValidItemArgs>().Result = GetIsValidItemResult(ci.Args()));
            db.PipelineWatcher.Register(Constants.Pipelines.ResolvePathToItem.IsValidItem, isValidItemProcessors);
        }

        private bool GetIsValidItemResult(object[] objects)
        {
            var args = objects[0] as IsValidItemArgs;
            standardItemValidator.Process(args);

            return args.Result;
        }

        private ResolveItemResult GetCreateResolveItemResult(object[] objects)
        {
            var args = objects[0] as CreateResolveItemResultArgs;
            standardCreateResolveItemResultProcessor.Process(args);
            standardValidatorResultProcessor.Process(args);

            return args.Result;
        }

        private ResolveItemResult GetResolvePathToItemResult(object[] objects)
        {
            var args = objects[0] as ResolvePathToItemArgs;
            standardPathToItemResolver.Configure().EncodeName(Arg.Any<string>())
                .Returns(displayName =>
                {
                    return displayName.Arg<string>().Replace(" ", "-");
                });
            standardPathToItemResolver.Process(args);
            resolveTransparentFolderProcessor.Process(args);

            return args.Result;
        }
    }
}