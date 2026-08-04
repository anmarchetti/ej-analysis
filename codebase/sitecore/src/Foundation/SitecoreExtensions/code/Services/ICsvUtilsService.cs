using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using easyJet.Foundation.SitecoreExtensions.Models;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface ICsvUtilsService
    {
        /// <summary>
        /// Read data from csv file.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="stream">Stream of file.</param>
        /// <param name="skipRows">The number of skipped rows.</param>
        /// <param name="delimeter">CSV delimeter string.</param>
        /// <returns>Collection of converted data.</returns>
        List<T> ReadFromCsv<T>(Stream stream, int skipRows = 1, string delimeter = "\t,")
            where T : new();

        /// <summary>
        /// Read data from csv file.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="stream">Stream of file.</param>
        /// <param name="fileParameters">The number of skipped rows.</param>
        /// <returns>Collection of converted data.</returns>
        List<T> ReadFromCsv<T>(Stream stream, FileParameters fileParameters)
              where T : class, new();

        /// <summary>
        /// Write data to csv file.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="data">Data to convert.</param>
        /// <param name="fileParameters">File parameters.</param>
        /// <returns>Array of bytes.</returns>
        byte[] WriteToCsv<T>(IEnumerable<T> data, FileParameters fileParameters);

        /// <summary>
        /// Write data to csv file.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="data">Data to convert.</param>
        /// <param name="delimeter">File delimeter.</param>
        /// <returns>Array of bytes.</returns>
        byte[] WriteToCsv<T>(IEnumerable<T> data, string delimeter = "\t");

        /// <summary>
        /// Create csv file based on data and immediately download it.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="data">Data to write to csv file.</param>
        /// <param name="filePath">File path to save.</param>
        void DownloadCsvFile<T>(IEnumerable<T> data, string filePath);

        /// <summary>
        /// Generating csv file response.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="productRequests">Collection of product requests.</param>
        /// <param name="fileName">File name to save.</param>
        /// <returns>HttpResponseMessage.</returns>
        HttpResponseMessage GenerateCsvFileReponseMessage<T>(IEnumerable<T> productRequests, string fileName);

        /// <summary>
        /// Generating csv file response message from array of bytes.
        /// </summary>
        /// <param name="fileContents">Array of bytes.</param>
        /// <param name="fileName">Output file name.</param>
        /// <returns>Http response file message.</returns>
        HttpResponseMessage GenerateCsvFileReponseMessage(byte[] fileContents, string fileName);

        /// <summary>
        /// Get rows from csv file.
        /// </summary>
        /// <param name="stream">Stream of file.</param>
        /// <returns>Rows from csv file.</returns>
        IEnumerable<string> GetCsvRows(Stream stream);

        /// <summary>
        /// Create object of type by csv line.
        /// </summary>
        /// <typeparam name="T">Convert type.</typeparam>
        /// <param name="line">Line in csv file.</param>
        /// <param name="delimeter">CSV delimeter string.</param>
        /// <returns>Object of type.</returns>
        T CreateFromCsv<T>(string line, string delimeter = "\t,")
            where T : new();
    }
}
