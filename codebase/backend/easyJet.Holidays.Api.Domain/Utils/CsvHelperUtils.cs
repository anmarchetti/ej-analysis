using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Utils
{
    /// <summary>
    /// Csv helper
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class CsvHelperUtils<T> where T : class
    {
        /// <summary>
        /// Write into csv file
        /// </summary>
        /// <param name="data"></param>
        /// <param name="filePath"></param>
        public static void Write(IEnumerable<T> data, string filePath)
        {
            using (var writer = new StreamWriter(filePath))
            {
                using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
                {
                    csv.WriteRecords(data);
                }
            }
        }

        /// <summary>
        /// Convert .csv format to objects(rows)
        /// </summary>
        /// <param name="file"></param>
        /// <param name="csvConfiguration"></param>
        /// <returns></returns>
        public static IList<T> Convert(byte[] file, CsvConfiguration csvConfiguration = null)
        {
            if (csvConfiguration == null)
            {
                csvConfiguration = new CsvConfiguration(CultureInfo.InvariantCulture);
            }

            using (var streamReader = new StreamReader(new MemoryStream(file), Encoding.Default))
            {
                using (var csvWriter = new CsvReader(streamReader, csvConfiguration))
                {
                    var deserializedRows = csvWriter.GetRecords<T>().ToList();
                    return deserializedRows;
                }
            }
        }

        /// <summary>
        /// Convert to array of bytes
        /// </summary>
        /// <param name="data"></param>
        /// <param name="csvConfiguration"></param>
        /// <returns></returns>
        public static byte[] Convert(IEnumerable<T> data, CsvConfiguration csvConfiguration = null)
        {
            if (csvConfiguration == null)
            {
                csvConfiguration = new CsvConfiguration(CultureInfo.InvariantCulture);
            }

            using (var memoryStream = new MemoryStream())
            {
                using (var streamWriter = new StreamWriter(memoryStream))
                {
                    using (var csvWriter = new CsvWriter(streamWriter, csvConfiguration))
                    {
                        csvWriter.WriteRecords(data);
                    }
                }

                return memoryStream.ToArray();
            }
        }
    }
}
