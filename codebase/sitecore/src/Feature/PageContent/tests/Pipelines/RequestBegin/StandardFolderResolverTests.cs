using System.Collections.Generic;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class StandardFolderResolverTests : GetItemUrlTestBase
    {
        [Theory]
        [MemberData(nameof(TransparentFolderResolverTestData.ResolveDifferentPaths), MemberType = typeof(TransparentFolderResolverTestData))]
        public void Resolve_ResolveNestedItems_DifferentItemNames(string because, string path, List<DtoItem> items, string idNeedsToBeResolved)
        {
            // Arrange
            var fakeSite = CreateFakeSite();
            CreateItemTree(items);
            RegisterPipelines();

            // Act
            var resolvedItem = ProcessItemWrapper(path, fakeSite, idNeedsToBeResolved);

            // Assert
            if (idNeedsToBeResolved == null)
            {
                resolvedItem.Should().BeNull(because);
            }
            else
            {
                resolvedItem.ID.ToString().Should().Be(idNeedsToBeResolved, because);
            }
        }
    }
}