using System;
using AutoFixture;
using AutoFixture.AutoNSubstitute;
using easyJet.Foundation.Translation.Common;
using easyJet.Foundation.Translation.Pipelines.GetItem;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.ItemProvider.GetItem;
using Sitecore.SecurityModel;
using Sitecore.Sites;
using Xunit;
using multisiteConstants = easyJet.Foundation.Multisite.Constants;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.Translation.Tests.Pipelines.GetItem
{
    public class DisabledFallbackAwareGetLanguageFallbackItemTests
    {
        private readonly Fixture fixture;

        private readonly DisabledFallbackAwareGetLanguageFallbackItem sut;

        public DisabledFallbackAwareGetLanguageFallbackItemTests()
        {
            fixture = new Fixture();
            fixture.Customize(new AutoNSubstituteCustomization());

            sut = Substitute.ForPartsOf<DisabledFallbackAwareGetLanguageFallbackItem>();
        }

        [Fact]
        public void Process_OnException_DoesNotProcessFurther()
        {
            // Arrange
            var args = GetValidArgs();
            var item = new FakeItem();
            var castItem = item.ToSitecoreItem();
            castItem.Name.Throws(new Exception());

            args.Result = castItem;

            // Act
            sut.Process(args);

            // Assert
            args.Result.Should().Be(castItem);
        }

        [Fact]
        public void Process_WhenProcessing_ItemWithMatchingLanguageExclusion_DisablesFallback()
        {
            // Arrange
            var dataBase = FakeUtil.FakeDatabase("aFakeDatabase");
            var languageItemID = ID.NewID;
            var fakeLangName = "en-US-test";
            var languageItem = new FakeItem(languageItemID, dataBase).WithName(fakeLangName);
            var args = GetValidArgs();
            var item = new FakeItem(database: dataBase)
                .WithLanguage(fakeLangName)
                .WithIsFallback(true);
            var disabledLanguagesField = new FakeField(new ID(), item).WithValue(languageItemID.ToString()).WithHasValue(true).WithName(multisiteConstants.Fields.BaseSetting.LanguagesWithDisabledFallback);

            item.WithField(disabledLanguagesField);

            args.Result = item;

            dataBase.GetItem(Arg.Is<ID>(param => param.Equals(languageItemID)), Arg.Any<Language>()).Returns(languageItem);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(DisabledFallbackAwareGetLanguageFallbackItemData.InvalidItems), MemberType = typeof(DisabledFallbackAwareGetLanguageFallbackItemData))]
        public void Process_ShouldProcess_HasInvalidItem_DoesNothing(Item invalidItem)
        {
            // Arrange
            var args = GetValidArgs();
            args.Result = invalidItem;

            // Act
            sut.Process(args);

            // Assert
            sut.ReceivedWithAnyArgs().GetItemFromArgs(default);
            sut.DidNotReceiveWithAnyArgs().SetItemToArgs(default, default);
        }

        [Theory]
        [MemberData(nameof(DisabledFallbackAwareGetLanguageFallbackItemData.UnProcessableContexts), MemberType = typeof(DisabledFallbackAwareGetLanguageFallbackItemData))]
        public void Process_ShouldNotProcess_DueToSiteOrIndexing(SiteContext ctx, bool mockIndexing)
        {
            // Arrange
            var args = GetValidArgs();

            // Act
            var indexingCtxSwitcher = mockIndexing ? new IndexingContextSwitcher() : null;
            using (indexingCtxSwitcher)
            using (new SiteContextSwitcher(ctx))
            {
                sut.Process(args);
            }

            // Assert
            sut.Configure().DidNotReceiveWithAnyArgs().GetItemFromArgs(default);
        }

        private GetItemArgs GetValidArgs()
        {
            var args = new GetItemArgs(fixture.Create<ItemProvider>(), ID.NewID, Language.Parse("en"), Version.Latest, FakeUtil.FakeDatabase(), SecurityCheck.Disable, true);
            return args;
        }
    }
}
