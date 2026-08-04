using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class ImagesContentResolverTests
    {
        private readonly ImagesContentResolver resolver;

        public ImagesContentResolverTests()
        {
            // Arrange
            resolver = new ImagesContentResolver()
            {
                UseContextItem = true
            };
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                var actual = resolver.ResolveContents(null, null);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfNotUseContextItemMode()
        {
            // Act
            resolver.UseContextItem = false;

            var actual = resolver.ResolveContents(new Rendering(), null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfItemSelectorQueryIsInvalid()
        {
            // Act
            using (new SafeContextItemSwitcher(null))
            {
                resolver.UseContextItem = true;
                resolver.ItemSelectorQuery = null;

                var actual = resolver.ResolveContents(new Rendering(), null);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldResolveContent_IfImageDataIsValid(Db db, Destinations.Models.Domain.ImageData image, ID imagesFolderId)
        {
            // Act
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = null;

            var contextItem = new DbItem("Context item");
            contextItem.Children.Add(new DbItem("Images Folder", imagesFolderId, Constants.TemplateIds.ImagesFolder)
            {
                Children =
                {
                    new DbItem("Image", ID.NewID, Constants.TemplateIds.ExternalImage)
                    {
                        { Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue },
                        { Constants.Fields.ExternalImageItem.Small, image.Small },
                        { Constants.Fields.ExternalImageItem.Medium, image.Medium },
                        { Constants.Fields.ExternalImageItem.Large, image.Large }
                    }
                }
            });

            db.Add(contextItem);

            using (new ContextItemSwitcher(db.GetItem(contextItem.ID)))
            {
                var actual = (dynamic)resolver.ResolveContents(new Rendering(), null);
                var result = new { Id = (ID)actual.Id, Images = (IEnumerable<Destinations.Models.Domain.ImageData>)actual.Images };

                // Assert
                result.Images.Should().HaveCount(1);
                result.Images.ElementAt(0).Small.Should().Be(image.Small);
                result.Images.ElementAt(0).Medium.Should().Be(image.Medium);
                result.Images.ElementAt(0).Large.Should().Be(image.Large);
                result.Id.Should().Be(imagesFolderId);
            }
        }
    }
}