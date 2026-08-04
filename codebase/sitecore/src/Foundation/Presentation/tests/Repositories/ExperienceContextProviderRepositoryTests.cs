using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;
using Xunit.Abstractions;

namespace easyJet.Foundation.Presentation.Tests.Repositories
{
    public class ExperienceContextProviderRepositoryTests
    {
        private readonly ID fieldActiveProviders = Constants.Fields.ExperienceContextProviders.ActiveProviders;
        private readonly ID fieldAllowedRenderings = Constants.Fields.ExperienceContextProviderPage.AllowedRenderings;
        private readonly ID fieldIdentifier = Constants.Fields.ExperienceContextProvider.Identifier;
        private readonly ID fieldPages = Constants.Fields.ExperienceContextProvider.Pages;
        private readonly ID fieldPage = Constants.Fields.ExperienceContextProviderPage.Page;
        private readonly IHtmlCacheRepository mockHtmlCacheRepository;
        private readonly ISitecoreContextProvider mockContext;
        private readonly IDatabaseProvider mockDbProvider;
        private readonly IPresentationLogger mockLogger;
        private readonly ITestOutputHelper output;
        private readonly ID pageTemplateId = Constants.TemplateIds.ExperienceContextProviderPage;

        private readonly ID providersTemplateId = Constants.TemplateIds.ExperienceContextProviders;
        private readonly ID providerTemplateId = Constants.TemplateIds.ExperienceContextProvider;
        private readonly ID rootId = Constants.ItemIds.ExperienceContextProvidersSettingsRoot;

        public ExperienceContextProviderRepositoryTests(ITestOutputHelper output)
        {
            mockDbProvider = Substitute.For<IDatabaseProvider>();
            mockLogger = Substitute.For<IPresentationLogger>();
            mockContext = Substitute.For<ISitecoreContextProvider>();
            mockHtmlCacheRepository = Substitute.For<IHtmlCacheRepository>();
            this.output = output;
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsEmpty_WhenNoMatchingIdentifier()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;

            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "foo" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(ID.NewID, "Context", pageTypeId, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(contextItem.ID).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);
            mockDb.GetItem(contextItem.ID, Arg.Any<Language>()).Returns(contextItem);

            mockContext.Item.Returns(contextItem);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { provider.ID }),
                (provider, fieldPages, new[] { page.ID }),
                (page, fieldAllowedRenderings, new[] { allowedRendering }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("bar", contextItem.ID);

            // ASSERT
            Assert.Empty(result);
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsRules_ForValidSetup()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var allowedRendering = ID.NewID;
            var contextId = ID.NewID;

            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, contextId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "foo" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(contextId, "Context", ID.NewID, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(contextItem.ID).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);
            mockDb.GetItem(contextItem.ID, Arg.Any<Language>()).Returns(contextItem);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { provider.ID }),
                (provider, fieldPages, new[] { page.ID }),
                (page, fieldAllowedRenderings, new[] { allowedRendering }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("foo", contextId);

            // ASSERT
            result.Should().NotBeEmpty();
            result.Should().HaveCount(1);
            result.First().AllowedRenderings.Should().Contain(allowedRendering);
        }

        [Fact]
        public void GetActiveProviderPages_WhenRepositoryRootMissing_LogsWarningAndReturnsEmpty()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDb.GetItem(rootId).Returns((Item)null);
            mockDb.GetItem(rootId, Arg.Any<Language>()).Returns((Item)null);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetActiveProviderPages("anything", ID.Null);

            // ASSERT
            result.Should().BeEmpty();
            mockLogger.Received().Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsEmpty_WhenNoDatabaseAvailable()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetActiveProviderPages("anything", ID.Null);

            // ASSERT
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetActiveProviderPages_WhenDatabaseIsNull_LogsWarningAndReturnsEmpty()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetActiveProviderPages("any", ID.Null);

            // ASSERT
            result.Should().BeEmpty();
            mockLogger.Received().Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsEmpty_WhenProviderIdentifierMissing()
        {
            // ARRANGE
            var invalidProviderId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var invalidProvider = CreateMockItem(
                invalidProviderId,
                "ProviderNoId",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "  " },
                    { fieldPages, string.Empty }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, invalidProvider.ID.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(invalidProvider.ID).Returns(invalidProvider);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(invalidProvider.ID, Arg.Any<Language>()).Returns(invalidProvider);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { invalidProvider.ID }),
                (invalidProvider, fieldPages, System.Array.Empty<ID>()));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("foo", ID.Null);

            // ASSERT
            Assert.Empty(result);
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsEmpty_WhenPageTemplateInvalid_OrNoRules()
        {
            // ARRANGE
            var invalidPageId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var invalidPage = CreateMockItem(
                invalidPageId,
                "InvalidPage",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, string.Empty },
                    { fieldAllowedRenderings, string.Empty }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "foo" },
                    { fieldPages, invalidPage.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(invalidPage.ID).Returns(invalidPage);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(invalidPage.ID, Arg.Any<Language>()).Returns(invalidPage);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { provider.ID }),
                (provider, fieldPages, new[] { invalidPage.ID }),
                (invalidPage, fieldAllowedRenderings, System.Array.Empty<ID>()));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("foo", ID.Null);

            // ASSERT
            Assert.Empty(result);
        }

        [Fact]
        public void BuildProvider_KeepsAllMatchingPageRules_IncludingThoseWithoutRenderings()
        {
            // ARRANGE
            var matchingTemplate = ID.NewID;
            var allowedRendering = ID.NewID;
            var pageNoRulesId = ID.NewID;
            var pageWithRulesId = ID.NewID;
            var providerId = ID.NewID;
            var contextId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageNoRules = CreateMockItem(
                pageNoRulesId,
                "Page_NoRules",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, contextId.ToString() },
                    { fieldAllowedRenderings, string.Empty }
                },
                mockDb);

            var pageWithRules = CreateMockItem(
                pageWithRulesId,
                "Page_WithRules",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, contextId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "foo" },
                    { fieldPages, pageNoRules.ID + "|" + pageWithRules.ID }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(contextId, "Context", matchingTemplate, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(pageNoRules.ID).Returns(pageNoRules);
            mockDb.GetItem(pageWithRules.ID).Returns(pageWithRules);
            mockDb.GetItem(contextItem.ID).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(pageNoRules.ID, Arg.Any<Language>()).Returns(pageNoRules);
            mockDb.GetItem(pageWithRules.ID, Arg.Any<Language>()).Returns(pageWithRules);
            mockDb.GetItem(contextItem.ID, Arg.Any<Language>()).Returns(contextItem);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();

            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root)
                .Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider)
                .Returns(new[] { pageNoRules, pageWithRules });

            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageNoRules)
                .Returns(Array.Empty<ID>());
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageWithRules)
                .Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("foo", contextId);

            // ASSERT — both rules are kept for the page; the rule without renderings is no longer filtered out.
            result.Should().HaveCount(2);
            result.Should().OnlyContain(rule => rule.PageItemId == contextId);
            result.Should().Contain(rule => rule.AllowedRenderings.Contains(allowedRendering));
            result.Should().Contain(rule => rule.AllowedRenderings.Count == 0);
        }

        [Fact]
        public void IsProviderActiveForPage_WhenRuleHasNoRenderings_ReturnsTrue()
        {
            // ARRANGE — a page rule without rendering surgery still marks the page as belonging to the provider.
            var pageItemId = ID.NewID;
            var providerId = ID.NewID;
            var pageRuleId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageRule = CreateMockItem(
                pageRuleId,
                "PageRule_NoRenderings",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageItemId.ToString() },
                    { fieldAllowedRenderings, string.Empty }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "foo" },
                    { fieldPages, pageRule.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            var pageItem = CreateMockItem(pageItemId, "Page", ID.NewID, null, mockDb);

            mockDb.GetItem(rootId).Returns(root);
            mockDb.GetItem(providerId).Returns(provider);
            mockDb.GetItem(pageRuleId).Returns(pageRule);
            mockDb.GetItem(pageItemId).Returns(pageItem);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { pageRule });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageRule).Returns(Array.Empty<ID>());

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsProviderActiveForPage("foo", pageItemId);

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void GetActiveProviderPages_ReturnsEmpty_WhenProvidersMissing()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetActiveProviderPages(null, ID.Null);

            // ASSERT
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void BuildPageRule_ReturnsNull_WhenTemplateMismatch()
        {
            // ARRANGE
            var method = typeof(ExperienceContextProviderRepository).GetMethod(
                "BuildPageRule",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var item = CreateMockItem(ID.NewID, "X", ID.NewID);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = method.Invoke(sut, new object[] { item });

            // ASSERT
            Assert.Null(result);
        }

        [Fact]
        public void BuildProvider_ReturnsNull_WhenTemplateMismatch()
        {
            // ARRANGE
            var method = typeof(ExperienceContextProviderRepository).GetMethod(
                "BuildProvider",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var item = CreateMockItem(ID.NewID, "Y", ID.NewID);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = method.Invoke(sut, new object[] { item });

            // ASSERT
            Assert.Null(result);
        }

        [Fact]
        public void BuildPageRule_ReturnsNull_WhenInvalidPageTemplateField()
        {
            // ARRANGE
            var method = typeof(ExperienceContextProviderRepository).GetMethod(
                "BuildPageRule",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var item = CreateMockItem(
                ID.NewID,
                "Page",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, "not-a-guid" }
                });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = method.Invoke(sut, new object[] { item });

            // ASSERT
            Assert.Null(result);
        }

        [Fact]
        public void IsProviderActiveForPage_WhenIdentifierIsEmpty_ReturnsFalse()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsProviderActiveForPage(string.Empty, ID.NewID);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenPageIdIsNull_ReturnsFalse()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsProviderActiveForPage("test-provider", ID.Null);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenProviderActiveAndPageTemplateMatches_ReturnsTrue()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);

            var pageItemTemplateId = ID.NewID;
            var pageItemId = ID.NewID;
            var providerId = ID.NewID;
            var pageRuleId = ID.NewID;

            var repositoryRoot = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                database);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, pageRuleId.ToString() }
                },
                database);

            var pageRuleItem = CreateMockItem(
                pageRuleId,
                "PageRule",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageItemId.ToString() }
                },
                database);

            var pageItem = CreateMockItem(pageItemId, "Page", pageItemTemplateId, null, database);

            database.GetItem(rootId).Returns(repositoryRoot);
            database.GetItem(providerId).Returns(providerItem);
            database.GetItem(pageRuleId).Returns(pageRuleItem);
            database.GetItem(pageItemId).Returns(pageItem);

            var mockFieldUtils = CreateMockFieldUtils(
                (repositoryRoot, fieldActiveProviders, new[] { providerId }),
                (providerItem, fieldPages, new[] { pageRuleId }),
                (pageRuleItem, fieldPage, new[] { pageItemId }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsProviderActiveForPage("test-provider", pageItemId);

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenProviderActiveButPageTemplateDoesNotMatch_ReturnsFalse()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);

            var pageItemTemplateId = ID.NewID;
            var differentPageItemId = ID.NewID;
            var pageItemId = ID.NewID;
            var providerId = ID.NewID;
            var pageRuleId = ID.NewID;

            var repositoryRoot = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                database);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, pageRuleId.ToString() }
                },
                database);

            var pageRuleItem = CreateMockItem(
                pageRuleId,
                "PageRule",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, differentPageItemId.ToString() }
                },
                database);

            var pageItem = CreateMockItem(pageItemId, "Page", pageItemTemplateId, null, database);

            database.GetItem(rootId).Returns(repositoryRoot);
            database.GetItem(providerId).Returns(providerItem);
            database.GetItem(pageRuleId).Returns(pageRuleItem);
            database.GetItem(pageItemId).Returns(pageItem);

            var mockFieldUtils = CreateMockFieldUtils(
                (repositoryRoot, fieldActiveProviders, new[] { providerId }),
                (providerItem, fieldPages, new[] { pageRuleId }),
                (pageRuleItem, fieldPage, new[] { differentPageItemId }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsProviderActiveForPage("test-provider", pageItemId);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void GetProviderItemId_WhenIdentifierIsEmpty_ReturnsNullId()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetProviderItemId(string.Empty);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void GetProviderItemId_WhenMatchingProviderExists_ReturnsProviderId()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);

            var providerId = ID.NewID;

            var repositoryRoot = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                database);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" }
                },
                database);

            database.GetItem(rootId).Returns(repositoryRoot);
            database.GetItem(providerId).Returns(providerItem);

            var mockFieldUtils = CreateMockFieldUtils(
                (repositoryRoot, fieldActiveProviders, new[] { providerId }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetProviderItemId("test-provider");

            // ASSERT
            result.Should().Be(providerId);
        }

        [Fact]
        public void GetProviderItemId_WhenNoMatchingProvider_ReturnsNullId()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);

            var providerId = ID.NewID;

            var repositoryRoot = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                database);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "other-provider" }
                },
                database);

            database.GetItem(rootId).Returns(repositoryRoot);
            database.GetItem(providerId).Returns(providerItem);

            var mockFieldUtils = CreateMockFieldUtils(
                (repositoryRoot, fieldActiveProviders, new[] { providerId }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetProviderItemId("test-provider");

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void GetProviderItemId_WhenDatabaseIsNull_ReturnsNullId()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetProviderItemId("test-provider");

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenDatabaseIsNull_ReturnsFalse()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenRepositoryRootNotFound_ReturnsFalse()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDb.GetItem(rootId).Returns((Item)null);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenCheckboxFieldIsChecked_ReturnsTrue()
        {
            // ARRANGE
            var verboseLoggingFieldId = Constants.Fields.ExperienceContextProvidersSettings.EnableVerboseLogging;
            var mockDb = Substitute.For<Database>();

            var settingsRoot = CreateMockItem(
                rootId,
                "ExperienceContextProvidersSettings",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { verboseLoggingFieldId, "1" }
                },
                mockDb);

            mockDb.GetItem(rootId).Returns(settingsRoot);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenCheckboxFieldIsUnchecked_ReturnsFalse()
        {
            // ARRANGE
            var verboseLoggingFieldId = Constants.Fields.ExperienceContextProvidersSettings.EnableVerboseLogging;
            var mockDb = Substitute.For<Database>();

            var settingsRoot = CreateMockItem(
                rootId,
                "ExperienceContextProvidersSettings",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { verboseLoggingFieldId, string.Empty }
                },
                mockDb);

            mockDb.GetItem(rootId).Returns(settingsRoot);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenExceptionThrown_LogsErrorAndReturnsFalse()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDb.GetItem(rootId).Throws(new InvalidOperationException("database error"));
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeFalse();
            mockLogger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetProviders_WhenDatabaseIsNull_ReturnsEmptyEnumerable()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetProviders();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetProviders_WhenActiveProvidersExist_ReturnsIdentifiers()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "my-provider" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetProviders().ToList();

            // ASSERT
            result.Should().ContainSingle();
            result.First().Should().Be("my-provider");
        }

        [Fact]
        public void GetProviders_WhenNoRootItem_ReturnsEmptyEnumerable()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDb.GetItem(rootId).Returns((Item)null);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetProviders();

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void IsValidIdentifier_WhenIdentifierMatchesActiveProvider_ReturnsTrue()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "hotel-ecp" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string> { { fieldActiveProviders, provider.ID.ToString() } },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsValidIdentifier("hotel-ecp");

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void IsValidIdentifier_WhenIdentifierMatchesDifferentCase_ReturnsTrue()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "hotel-ecp" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string> { { fieldActiveProviders, provider.ID.ToString() } },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsValidIdentifier("HOTEL-ECP");

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void IsValidIdentifier_WhenIdentifierNotInActiveProviders_ReturnsFalse()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "hotel-ecp" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string> { { fieldActiveProviders, provider.ID.ToString() } },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsValidIdentifier("unknown-provider");

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsValidIdentifier_WhenNoActiveProviders_ReturnsFalse()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsValidIdentifier("hotel-ecp");

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void GetActiveProvider_WhenIdentifierIsNullOrWhitespace_ReturnsNull()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(Substitute.For<Database>());
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var resultNull = sut.GetActiveProvider(null);
            var resultWhitespace = sut.GetActiveProvider("   ");

            // ASSERT
            resultNull.Should().BeNull();
            resultWhitespace.Should().BeNull();
        }

        [Fact]
        public void GetActiveProvider_WhenDatabaseIsNull_ReturnsNull()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.GetActiveProvider("some-provider");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetActiveProvider_WhenProviderFound_ReturnsConfig()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "my-provider" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProvider("my-provider");

            // ASSERT
            result.Should().NotBeNull();
            result.Identifier.Should().Be("my-provider");
        }

        [Fact]
        public void GetActiveProvider_WhenProviderNotFound_ReturnsNull()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var pageTypeId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageTypeId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "my-provider" },
                    { fieldPages, page.ID.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "ExperienceContextProviders",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, provider.ID.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(provider.ID).Returns(provider);
            mockDb.GetItem(page.ID).Returns(page);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(provider.ID, Arg.Any<Language>()).Returns(provider);
            mockDb.GetItem(page.ID, Arg.Any<Language>()).Returns(page);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { provider });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), provider).Returns(new[] { page });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), page).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProvider("non-existent-provider");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenPageItemNotFoundInDatabase_ReturnsFalse()
        {
            // ARRANGE
            var database = Substitute.For<Database>();
            var missingPageId = ID.NewID;
            database.GetItem(missingPageId).Returns((Item)null);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(database);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsProviderActiveForPage("some-provider", missingPageId);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenDatabaseIsNull_ReturnsFalse()
        {
            // ARRANGE
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns((Database)null);
            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = sut.IsProviderActiveForPage("test-provider", ID.NewID);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void IsProviderActiveForPage_WhenProviderHasNoPages_ReturnsFalse()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageItem = CreateMockItem(pageId, "Page", ID.NewID, null, mockDb);
            mockDb.GetItem(pageId).Returns(pageItem);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(System.Array.Empty<Item>());

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.IsProviderActiveForPage("test-provider", pageId);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void GetProviderItemId_WhenProviderItemsEmpty_ReturnsNullId()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, string.Empty }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(System.Array.Empty<Item>());

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetProviderItemId("test-provider");

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void GetProviderItemId_WhenItemTemplateMismatch_ReturnsNullId()
        {
            // ARRANGE
            var wrongTemplateId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var wrongItem = CreateMockItem(
                providerId,
                "WrongTemplate",
                wrongTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { wrongItem });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetProviderItemId("test-provider");

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void FetchActiveProviders_WhenPageRuleHasRenderingReplacements_ParsesMappings()
        {
            // ARRANGE
            var pageId = ID.NewID;
            var targetPageId = ID.NewID;
            var providerId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mappingKey = ID.NewID;
            var mappingValue = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var replacementsFieldValue = $"{mappingKey}:{mappingValue}:param1=val1";

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, targetPageId.ToString() },
                    { fieldAllowedRenderings, allowedRendering.ToString() },
                    { Constants.Fields.ExperienceContextProviderPage.RenderingReplacements, replacementsFieldValue }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "ecp" },
                    { fieldPages, pageId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(provider);
            mockDb.GetItem(pageId).Returns(page);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { provider.ID }),
                (provider, fieldPages, new[] { page.ID }),
                (page, fieldAllowedRenderings, new[] { allowedRendering }));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("ecp", targetPageId);

            // ASSERT
            result.Should().NotBeEmpty();
            var rule = result.First();
            rule.RenderingReplacements.Should().NotBeEmpty();
            rule.RenderingReplacements.Should().ContainSingle(m => m.Key == mappingKey && m.First().ValueId == mappingValue);
        }

        [Fact]
        public void FetchActiveProviders_WhenPageRuleHasJustRemoveMapping_ParsesMappingWithIsJustRemoveTrue()
        {
            // Arrange
            var pageId = ID.NewID;
            var targetPageId = ID.NewID;
            var providerId = ID.NewID;
            var mappingKey = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var replacementsFieldValue = $"{mappingKey}:JUST_REMOVE:";

            var page = CreateMockItem(
                pageId,
                "PageA",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, targetPageId.ToString() },
                    { Constants.Fields.ExperienceContextProviderPage.RenderingReplacements, replacementsFieldValue }
                },
                mockDb);

            var provider = CreateMockItem(
                providerId,
                "ProviderA",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "ecp" },
                    { fieldPages, pageId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(provider);
            mockDb.GetItem(pageId).Returns(page);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = CreateMockFieldUtils(
                (root, fieldActiveProviders, new[] { provider.ID }),
                (provider, fieldPages, new[] { page.ID }),
                (page, fieldAllowedRenderings, Array.Empty<ID>()));

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // Act
            var result = sut.GetActiveProviderPages("ecp", targetPageId);

            // Assert
            result.Should().NotBeEmpty();
            var rule = result.First();
            rule.RenderingReplacements.Should().NotBeEmpty();
            var mapping = rule.RenderingReplacements[mappingKey].First();
            mapping.IsJustRemove.Should().BeTrue();
            mapping.ValueId.Should().Be(ID.Null);
        }

        [Fact]
        public void FetchActiveProviders_WhenTemplateRuleHasRenderingReplacements_ParsesMappings()
        {
            // ARRANGE
            var templateRuleId = ID.NewID;
            var targetTemplateId = ID.NewID;
            var providerId = ID.NewID;
            var allowedRendering = ID.NewID;
            var mappingKey = ID.NewID;
            var mappingValue = ID.NewID;
            var uid = System.Guid.NewGuid();
            var mockDb = Substitute.For<Database>();

            var replacementsFieldValue = $"{mappingKey}:{mappingValue}:params:{uid}";

            var templateRule = CreateMockItem(
                templateRuleId,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, targetTemplateId.ToString() },
                    { Constants.Fields.ExperienceContextProviderPageTemplate.AllowedRenderings, allowedRendering.ToString() },
                    { Constants.Fields.ExperienceContextProviderPageTemplate.RenderingReplacements, replacementsFieldValue }
                },
                mockDb);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "ecp" },
                    { fieldPages, templateRuleId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            var contextItemId = ID.NewID;
            var contextItem = CreateMockItem(contextItemId, "ContextPage", targetTemplateId, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDb.GetItem(templateRuleId).Returns(templateRule);
            mockDb.GetItem(contextItemId).Returns(contextItem);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(new[] { templateRule });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), templateRule).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("ecp", contextItemId);

            // ASSERT
            result.Should().NotBeEmpty();
            var rule = result.First();
            rule.RenderingReplacements.Should().ContainSingle(m => m.Key == mappingKey && m.First().ValueId == mappingValue && m.First().Uid == uid);
        }

        [Fact]
        public void MatchesContextItemTemplate_WhenContextItemTemplateIdIsNull_ReturnsFalse()
        {
            // ARRANGE
            var contextItemId = ID.NewID;
            var providerId = ID.NewID;
            var pageRuleId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageRuleItem = CreateMockItem(
                pageRuleId,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, ID.Null.ToString() }
                },
                mockDb);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, pageRuleId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDb.GetItem(pageRuleId).Returns(pageRuleItem);
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(new[] { pageRuleItem });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageRuleItem).Returns(new[] { ID.NewID });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("test-provider", contextItemId);

            // ASSERT
            result.Should().BeEmpty();
        }

        // ============================================================
        // Cache Behavior Tests
        // ============================================================
        [Fact]
        public void GetProviders_WhenCacheHasData_ReturnsCachedValue()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            IReadOnlyCollection<ExperienceContextProviderConfig> cachedProviders =
                new List<ExperienceContextProviderConfig>
                {
                    new ExperienceContextProviderConfig("cached-provider", null)
                }.AsReadOnly();

            mockHtmlCacheRepository
                .GetOrAdd<IReadOnlyCollection<ExperienceContextProviderConfig>>(
                    Arg.Any<string>(),
                    Arg.Any<Func<IReadOnlyCollection<ExperienceContextProviderConfig>>>())
                .Returns(cachedProviders);

            var sut = new ExperienceContextProviderRepository(
                mockDbProvider, mockLogger, mockContext, mockHtmlCacheRepository);

            // ACT
            var result = sut.GetProviders().ToList();

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be("cached-provider");
            mockDb.DidNotReceive().GetItem(Arg.Any<ID>());
        }

        [Fact]
        public void GetProviders_WhenCacheIsEmpty_FetchesFromDatabase()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var root = CreateMockItem(rootId, "Root", providersTemplateId, null, mockDb);
            mockDb.GetItem(rootId).Returns(root);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils
                .GetMultilistTargetItems(Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Array.Empty<Item>());

            var sut = new ExperienceContextProviderRepository(
                mockDbProvider, mockLogger, mockContext, new AlwaysInvokeCacheStub(), mockFieldUtils);

            // ACT
            var result = sut.GetProviders().ToList();

            // ASSERT
            result.Should().BeEmpty();
            mockDb.Received().GetItem(rootId);
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenCacheHasData_ReturnsCachedValue()
        {
            // ARRANGE
            // mockHtmlCacheRepository returns null by default for GetOrAdd<CachedBool> (NSubstitute default
            // for reference types). null?.Value ?? false returns false — the factory is never invoked
            // so the database is not touched, proving the cache layer is in place.
            var mockDb = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var sut = new ExperienceContextProviderRepository(
                mockDbProvider, mockLogger, mockContext, mockHtmlCacheRepository);

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeFalse();
            mockDb.DidNotReceive().GetItem(Arg.Any<ID>());
        }

        [Fact]
        public void IsVerboseLoggingEnabled_WhenCacheIsEmpty_FetchesFromDatabase()
        {
            // ARRANGE
            var mockDb = Substitute.For<Database>();
            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var verboseLoggingFieldId = Constants.Fields.ExperienceContextProvidersSettings.EnableVerboseLogging;
            var settingsRoot = CreateMockItem(
                rootId,
                "ExperienceContextProvidersSettings",
                providersTemplateId,
                new Dictionary<ID, string> { { verboseLoggingFieldId, "1" } },
                mockDb);

            mockDb.GetItem(rootId).Returns(settingsRoot);

            var sut = new ExperienceContextProviderRepository(
                mockDbProvider, mockLogger, mockContext, new AlwaysInvokeCacheStub());

            // ACT
            var result = sut.IsVerboseLoggingEnabled();

            // ASSERT
            result.Should().BeTrue();
            mockDb.Received().GetItem(rootId);
        }

        // ============================================================
        // Template-Based Page Rule Tests
        // ============================================================
        [Fact]
        public void BuildPageRule_WhenTemplateBasedItem_ReturnsRuleWithIsTemplateBased()
        {
            // ARRANGE
            var method = typeof(ExperienceContextProviderRepository).GetMethod(
                "BuildPageRule",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var pageTemplateRuleTemplateId = Constants.TemplateIds.ExperienceContextProviderPageTemplate;
            var targetTemplateId = ID.NewID;
            var allowedRendering = ID.NewID;

            var item = CreateMockItem(
                ID.NewID,
                "TemplateRule",
                pageTemplateRuleTemplateId,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, targetTemplateId.ToString() },
                    { Constants.Fields.ExperienceContextProviderPageTemplate.AllowedRenderings, allowedRendering.ToString() }
                });

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), item).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = (ExperienceContextProviderPageRule)method.Invoke(sut, new object[] { item });

            // ASSERT
            result.Should().NotBeNull();
            result.IsTemplateBased.Should().BeTrue();
            result.PageItemId.Should().Be(targetTemplateId);
        }

        [Fact]
        public void BuildPageRule_WhenTemplateBasedItem_ReturnsNullWhenPageTemplateFieldEmpty()
        {
            // ARRANGE
            var method = typeof(ExperienceContextProviderRepository).GetMethod(
                "BuildPageRule",
                BindingFlags.NonPublic | BindingFlags.Instance);

            var item = CreateMockItem(
                ID.NewID,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, "not-a-guid" }
                });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext);

            // ACT
            var result = method.Invoke(sut, new object[] { item });

            // ASSERT
            Assert.Null(result);
        }

        [Fact]
        public void GetActiveProviderPages_WithTemplateBasedRule_MatchesByContextItemTemplate()
        {
            // ARRANGE
            var contextPageTemplateId = ID.NewID;
            var contextItemId = ID.NewID;
            var allowedRendering = ID.NewID;
            var pageRuleId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageRuleItem = CreateMockItem(
                pageRuleId,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, contextPageTemplateId.ToString() }
                },
                mockDb);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, pageRuleId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(contextItemId, "ContextPage", contextPageTemplateId, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDb.GetItem(pageRuleId).Returns(pageRuleItem);
            mockDb.GetItem(contextItemId).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(providerId, Arg.Any<Language>()).Returns(providerItem);
            mockDb.GetItem(pageRuleId, Arg.Any<Language>()).Returns(pageRuleItem);
            mockDb.GetItem(contextItemId, Arg.Any<Language>()).Returns(contextItem);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(new[] { pageRuleItem });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageRuleItem).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("test-provider", contextItemId);

            // ASSERT
            result.Should().NotBeEmpty();
            result.Should().HaveCount(1);
            result.First().IsTemplateBased.Should().BeTrue();
            result.First().PageItemId.Should().Be(contextPageTemplateId);
        }

        [Fact]
        public void GetActiveProviderPages_WithTemplateBasedRule_DoesNotMatchWhenTemplateDiffers()
        {
            // ARRANGE
            var ruleTemplateId = ID.NewID;
            var differentTemplateId = ID.NewID;
            var contextItemId = ID.NewID;
            var allowedRendering = ID.NewID;
            var pageRuleId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageRuleItem = CreateMockItem(
                pageRuleId,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, ruleTemplateId.ToString() }
                },
                mockDb);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, pageRuleId.ToString() }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(contextItemId, "ContextPage", differentTemplateId, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDb.GetItem(pageRuleId).Returns(pageRuleItem);
            mockDb.GetItem(contextItemId).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(providerId, Arg.Any<Language>()).Returns(providerItem);
            mockDb.GetItem(pageRuleId, Arg.Any<Language>()).Returns(pageRuleItem);
            mockDb.GetItem(contextItemId, Arg.Any<Language>()).Returns(contextItem);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(new[] { pageRuleItem });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageRuleItem).Returns(new[] { allowedRendering });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("test-provider", contextItemId);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetActiveProviderPages_WithMixedRules_ReturnsBothPageAndTemplateMatches()
        {
            // ARRANGE
            var contextTemplateId = ID.NewID;
            var contextItemId = ID.NewID;
            var allowedRendering1 = ID.NewID;
            var allowedRendering2 = ID.NewID;
            var pageRulePageId = ID.NewID;
            var pageRulePageItemId = contextItemId;
            var pageRuleTemplateId = ID.NewID;
            var providerId = ID.NewID;
            var mockDb = Substitute.For<Database>();

            var pageBasedRule = CreateMockItem(
                pageRulePageId,
                "PageRule",
                pageTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldPage, pageRulePageItemId.ToString() }
                },
                mockDb);

            var templateBasedRule = CreateMockItem(
                pageRuleTemplateId,
                "TemplateRule",
                Constants.TemplateIds.ExperienceContextProviderPageTemplate,
                new Dictionary<ID, string>
                {
                    { Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, contextTemplateId.ToString() }
                },
                mockDb);

            var providerItem = CreateMockItem(
                providerId,
                "Provider",
                providerTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldIdentifier, "test-provider" },
                    { fieldPages, string.Join("|", pageRulePageId, pageRuleTemplateId) }
                },
                mockDb);

            var root = CreateMockItem(
                rootId,
                "Root",
                providersTemplateId,
                new Dictionary<ID, string>
                {
                    { fieldActiveProviders, providerId.ToString() }
                },
                mockDb);

            var contextItem = CreateMockItem(contextItemId, "ContextPage", contextTemplateId, null, mockDb);

            mockDb.GetItem(root.ID).Returns(root);
            mockDb.GetItem(providerId).Returns(providerItem);
            mockDb.GetItem(pageRulePageId).Returns(pageBasedRule);
            mockDb.GetItem(pageRuleTemplateId).Returns(templateBasedRule);
            mockDb.GetItem(contextItemId).Returns(contextItem);
            mockDb.GetItem(root.ID, Arg.Any<Language>()).Returns(root);
            mockDb.GetItem(providerId, Arg.Any<Language>()).Returns(providerItem);
            mockDb.GetItem(pageRulePageId, Arg.Any<Language>()).Returns(pageBasedRule);
            mockDb.GetItem(pageRuleTemplateId, Arg.Any<Language>()).Returns(templateBasedRule);
            mockDb.GetItem(contextItemId, Arg.Any<Language>()).Returns(contextItem);

            mockDbProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(mockDb);

            var mockFieldUtils = Substitute.For<IFieldUtilsService>();
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), root).Returns(new[] { providerItem });
            mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), providerItem).Returns(new[] { pageBasedRule, templateBasedRule });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), pageBasedRule).Returns(new[] { allowedRendering1 });
            mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), templateBasedRule).Returns(new[] { allowedRendering2 });

            var sut = new TestableExperienceContextProviderRepository(mockDbProvider, mockLogger, mockContext, mockFieldUtils);

            // ACT
            var result = sut.GetActiveProviderPages("test-provider", contextItemId).ToList();

            // ASSERT
            result.Should().HaveCount(2);
            result.Should().Contain(r => !r.IsTemplateBased && r.PageItemId.Equals(contextItemId));
            result.Should().Contain(r => r.IsTemplateBased && r.PageItemId.Equals(contextTemplateId));
        }

        private Item CreateMockItem(ID expectedId, string displayName, ID templateId, Dictionary<ID, string> fieldValues = null, Database database = null)
        {
            FakeItem builder;
            if (database != null)
            {
                builder = new FakeItem(expectedId, database);
            }
            else
            {
                builder = new FakeItem(expectedId);
            }

            builder = builder
                .WithTemplate(templateId)
                .WithDisplayName(displayName);

            if (fieldValues != null)
            {
                foreach (var kvp in fieldValues)
                {
                    builder = builder.WithField(kvp.Key, kvp.Value);
                }
            }

            var item = builder.ToSitecoreItem();

            if (fieldValues != null)
            {
                foreach (var kvp in fieldValues)
                {
                    try
                    {
                        var f = item.Fields[kvp.Key];
                        if (f != null)
                        {
                            var prop = f.GetType().GetProperty("Name");
                            if (prop != null && prop.CanWrite)
                            {
                                prop.SetValue(f, kvp.Key.ToString());
                                continue;
                            }

                            var backing = f.GetType().GetField("m_name", BindingFlags.Instance | BindingFlags.NonPublic)
                                          ?? f.GetType().GetField("name", BindingFlags.Instance | BindingFlags.NonPublic)
                                          ?? f.GetType().GetField("_name", BindingFlags.Instance | BindingFlags.NonPublic);
                            if (backing != null)
                            {
                                backing.SetValue(f, kvp.Key.ToString());
                            }
                        }
                    }
                    catch
                    {
                    }
                }
            }

            return item;
        }

        private IFieldUtilsService CreateMockFieldUtils(params (Item item, ID fieldId, ID[] values)[] fieldConfigs)
        {
            var mockFieldUtils = Substitute.For<IFieldUtilsService>();

            foreach (var (item, fieldId, values) in fieldConfigs)
            {
                var targetItems = values.Select(id => item.Database.GetItem(id))
                    .Where(i => i != null)
                    .ToArray();

                mockFieldUtils.GetMultilistTargetItems(Arg.Any<ID>(), item)
                    .Returns(targetItems);

                mockFieldUtils.GetMultilistTargetIds(Arg.Any<ID>(), item)
                    .Returns(values);
            }

            return mockFieldUtils;
        }

        private sealed class AlwaysInvokeCacheStub : IHtmlCacheRepository
        {
            public T GetItem<T>(string key)
                where T : class => null;

            public void RemoveItem(string key)
            {
            }

            public T StoreItem<T>(string key, T item, int expirationMinutes = 0)
                where T : class => item;

            public T GetOrAdd<T>(string key, Func<T> getData, int expirationMinutes = 0)
                where T : class => getData();

            public Task<TResponse> GetOrCreateAsync<TResponse>(Func<Task<TResponse>> method, string key)
                where TResponse : class => method();
        }
    }
}
