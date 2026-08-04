using System;
using easyJet.Foundation.Multisite.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetLayoutServiceContext
{
    public class ExtendedSiteContextTests
    {
        private readonly IItemSiteResolver itemSiteResolver;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly ExtendedSiteContext sut;

        public ExtendedSiteContextTests()
        {
            itemSiteResolver = Substitute.For<IItemSiteResolver>();
            multiSiteContext = Substitute.For<IMultiSiteContext>();
            sut = new ExtendedSiteContext(itemSiteResolver, multiSiteContext);
        }

        [Fact]
        public void Process_ShouldReturnEarly_WhenSiteKeyAlreadyExists()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();
            args.ContextData.Add(ExtendedSiteContext.SiteKey, new { name = "existing" });

            // Act
            sut.Process(args);

            // Assert
            args.ContextData.Should().NotContainKey(ExtendedSiteContext.PageStateKey);
            args.ContextData.Should().NotContainKey(ExtendedSiteContext.PublishDiagnosticKey);
        }

        [Fact]
        public void Process_ShouldAddSiteAndPageState_WhenContextIsValid()
        {
            using (var db = new Db())
            {
                // Arrange
                var contextDbItem = new DbItem("TestPage");
                db.Add(contextDbItem);

                multiSiteContext.GetSettingsItem(Arg.Any<Item>()).Returns((Item)null);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

                var args = new GetLayoutServiceContextArgs();

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    Context.Item = db.GetItem(contextDbItem.ID);

                    // Act
                    sut.Process(args);
                }

                // Assert
                args.ContextData.Should().ContainKey(ExtendedSiteContext.SiteKey);
                args.ContextData.Should().ContainKey(ExtendedSiteContext.PageStateKey);
                args.ContextData.Should().NotContainKey(ExtendedSiteContext.PublishDiagnosticKey);
            }
        }

        [Fact]
        public void Process_ShouldAddPublishDiagnostic_WhenDiagnosticItemExists()
        {
            using (var db = new Db())
            {
                // Arrange
                db.Add(new DbTemplate("Publish Diagnostic", Templates.PublishDiagnostic.Id)
                {
                    new DbField(Templates.PublishDiagnostic.Fields.Field),
                    new DbField(Templates.PublishDiagnostic.Fields.SharedField),
                    new DbField(Templates.PublishDiagnostic.Fields.SharedUnversionedField),
                    new DbField(Templates.PublishDiagnostic.Fields.UnversionedField)
                });

                var diagnosticDbItem = new DbItem("Publish Diagnostic", ID.NewID, Templates.PublishDiagnostic.Id);
                diagnosticDbItem.Fields.Add(new DbField(Templates.PublishDiagnostic.Fields.Field) { Value = "test-field" });
                diagnosticDbItem.Fields.Add(new DbField(Templates.PublishDiagnostic.Fields.SharedField) { Value = "test-shared" });
                diagnosticDbItem.Fields.Add(new DbField(Templates.PublishDiagnostic.Fields.SharedUnversionedField) { Value = "test-shared-unversioned" });
                diagnosticDbItem.Fields.Add(new DbField(Templates.PublishDiagnostic.Fields.UnversionedField) { Value = "test-unversioned" });

                var settingsDbItem = new DbItem("Settings");
                settingsDbItem.Add(diagnosticDbItem);
                db.Add(settingsDbItem);

                var contextDbItem = new DbItem("TestPage");
                db.Add(contextDbItem);

                multiSiteContext.GetSettingsItem(Arg.Any<Item>()).Returns(db.GetItem(settingsDbItem.ID));

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

                var args = new GetLayoutServiceContextArgs();

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    Context.Item = db.GetItem(contextDbItem.ID);

                    // Act
                    sut.Process(args);
                }

                // Assert
                args.ContextData.Should().ContainKey(ExtendedSiteContext.SiteKey);
                args.ContextData.Should().ContainKey(ExtendedSiteContext.PageStateKey);
                args.ContextData.Should().ContainKey(ExtendedSiteContext.PublishDiagnosticKey);

                dynamic diagnostic = args.ContextData[ExtendedSiteContext.PublishDiagnosticKey];
                ((string)diagnostic.field).Should().Be("test-field");
                ((string)diagnostic.sharedField).Should().Be("test-shared");
                ((string)diagnostic.sharedUnversionedField).Should().Be("test-shared-unversioned");
                ((string)diagnostic.unversionedField).Should().Be("test-unversioned");
                ((string)diagnostic.server).Should().Be(Environment.MachineName);
                ((string)diagnostic.revision).Should().NotBeNullOrEmpty();
                ((string)diagnostic.updated).Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void Process_ShouldNotAddPublishDiagnostic_WhenSettingsItemIsNull()
        {
            using (var db = new Db())
            {
                // Arrange
                var contextDbItem = new DbItem("TestPage");
                db.Add(contextDbItem);

                multiSiteContext.GetSettingsItem(Arg.Any<Item>()).Returns((Item)null);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

                var args = new GetLayoutServiceContextArgs();

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    Context.Item = db.GetItem(contextDbItem.ID);

                    // Act
                    sut.Process(args);
                }

                // Assert
                args.ContextData.Should().ContainKey(ExtendedSiteContext.SiteKey);
                args.ContextData.Should().ContainKey(ExtendedSiteContext.PageStateKey);
                args.ContextData.Should().NotContainKey(ExtendedSiteContext.PublishDiagnosticKey);
            }
        }

        [Fact]
        public void Process_ShouldNotAddPublishDiagnostic_WhenSettingsHasNoDiagnosticChild()
        {
            using (var db = new Db())
            {
                // Arrange
                var settingsDbItem = new DbItem("Settings");
                db.Add(settingsDbItem);

                var contextDbItem = new DbItem("TestPage");
                db.Add(contextDbItem);

                multiSiteContext.GetSettingsItem(Arg.Any<Item>()).Returns(db.GetItem(settingsDbItem.ID));

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

                var args = new GetLayoutServiceContextArgs();

                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    Context.Item = db.GetItem(contextDbItem.ID);

                    // Act
                    sut.Process(args);
                }

                // Assert
                args.ContextData.Should().ContainKey(ExtendedSiteContext.SiteKey);
                args.ContextData.Should().ContainKey(ExtendedSiteContext.PageStateKey);
                args.ContextData.Should().NotContainKey(ExtendedSiteContext.PublishDiagnosticKey);
            }
        }
    }
}
