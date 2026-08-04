using easyJet.Holidays.External.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Utils
{
    public class ZipUtilsTests
    {
        [Theory]
        [AutoMoqData]
        public async Task ZipUtils_CompressAndDecompress_CorrectResult(string fileContent, string fileName)
        {
            var fileBytes = Encoding.UTF8.GetBytes(fileContent);

            var compressedFile = await ZipUtils.CompressAsync(fileName, fileBytes);

            var decompressedFile = await ZipUtils.DecompressFirstFileAsync(compressedFile);

            var decompressedFileContent = Encoding.UTF8.GetString(decompressedFile);

            decompressedFileContent.Should().BeEquivalentTo(fileContent);
            decompressedFile.Should().BeEquivalentTo(fileBytes);
        }
    }
}