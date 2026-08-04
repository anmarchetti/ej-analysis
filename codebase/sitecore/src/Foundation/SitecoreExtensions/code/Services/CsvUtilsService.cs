using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Models;
using Sitecore.IO;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// TODO: Refactor CsvUtilsService. Remove custom functionality for parsing CSV files. Use CVS Helper instead.
    /// </summary>
    [Service(typeof(ICsvUtilsService), Lifetime = Lifetime.Transient)]
    public class CsvUtilsService : ICsvUtilsService
    {
        private const string Attachment = "attachment";

        /// <inheritdoc/>
        public List<T> ReadFromCsv<T>(Stream stream, FileParameters fileParameters)
              where T : class, new()
        {
            var csvConfig = new CsvHelper.Configuration.Configuration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = fileParameters.HasHeaderRecord,
                HeaderValidated = null,
                MissingFieldFound = null,
                Delimiter = fileParameters.FileDataDelimiter
            };

            if (fileParameters.ClassMap != null)
            {
                csvConfig.RegisterClassMap(fileParameters.ClassMap);
            }

            using (var reader = new StreamReader(stream))
            {
                using (var csvReader = new CsvReader(reader, csvConfig))
                {
                    return csvReader.GetRecords<T>().ToList();
                }
            }
        }

        /// <inheritdoc/>
        public List<T> ReadFromCsv<T>(Stream stream, int skipRows = 1, string delimiter = "\t,")
            where T : new()
        {
            // TextFieldParser
            var csvLinesToModels = new List<T>();

            var csvRows = GetCsvRows(stream);

            foreach (var csvRow in csvRows)
            {
                csvLinesToModels.Add(CreateFromCsv<T>(csvRow, delimiter));
            }

            // Skip rows to get rid from column names.
            if (csvLinesToModels.Count > skipRows && skipRows > 0)
            {
                return csvLinesToModels.Skip(skipRows).ToList();
            }

            return csvLinesToModels;
        }

        /// <inheritdoc/>
        public byte[] WriteToCsv<T>(IEnumerable<T> data, FileParameters fileParameters)
        {
            using (var ms = new MemoryStream())
            using (var output = new StreamWriter(ms, Encoding.UTF8))
            using (var csvWriter = new CsvWriter(output, GetConfiguration(fileParameters)))
            {
                csvWriter.WriteRecords(data);
                output.Flush();
                ms.Flush();
                return ms.ToArray();
            }
        }

        /// <inheritdoc/>
        public byte[] WriteToCsv<T>(IEnumerable<T> data, string delimeter = "\t")
        {
            using (var ms = new MemoryStream())
            {
                using (var output = new StreamWriter(ms, Encoding.Unicode))
                {
                    var props = typeof(T).GetProperties();
                    foreach (var prop in props)
                    {
                        output.Write(AddSpacesToSentence(prop.Name)); // header
                        output.Write(delimeter);
                    }

                    output.WriteLine();
                    foreach (var item in data)
                    {
                        foreach (var prop in props)
                        {
                            output.Write(prop.GetValue(item));
                            output.Write(delimeter);
                        }

                        output.WriteLine();
                    }

                    output.Flush();
                    ms.Flush();
                    return ms.ToArray();
                }
            }
        }

        /// <inheritdoc/>
        public void DownloadCsvFile<T>(IEnumerable<T> data, string filePath)
        {
            byte[] fileContents = WriteToCsv(data);

            FileUtil.WriteToFile(filePath, ref fileContents);
            SheerResponse.Download(filePath);
        }

        /// <inheritdoc/>
        public HttpResponseMessage GenerateCsvFileReponseMessage<T>(IEnumerable<T> productRequests, string fileName)
        {
            byte[] fileContents = WriteToCsv(productRequests);

            return GenerateCsvFileReponseMessage(fileContents, fileName);
        }

        /// <inheritdoc/>
        public HttpResponseMessage GenerateCsvFileReponseMessage(byte[] fileContents, string fileName)
        {
            var stream = new StreamContent(new MemoryStream(fileContents));
            var result = new HttpResponseMessage(HttpStatusCode.OK) { Content = stream };
            result.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue(Attachment) { FileName = fileName };
            result.Content.Headers.ContentType = new MediaTypeHeaderValue(Constants.ContentTypes.ExcelResponse);
            return result;
        }

        /// <summary>
        /// Geting object from csv line.
        /// </summary>
        /// <typeparam name="T">Result object type.</typeparam>
        /// <param name="line">Line from csv file.</param>
        /// <param name="delimeter">CSV delimiter string.</param>
        /// <returns>Object of specified type.</returns>
        public T CreateFromCsv<T>(string line, string delimeter = "\t,")
            where T : new()
        {
            var item = new T();
            var type = item.GetType();
            var properties = GetProperties(type);

            var values = Regex.Split(line, $"[{delimeter}](?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

            int length = values.Length < properties.Length ? values.Length : properties.Length;
            for (var i = 0; i < length; i++)
            {
                // Array properties should be last property
                if (i == length - 1 && properties[i].PropertyType.IsArray)
                {
                    values = values.Skip(i).Take(values.Length - i).ToArray();
                    var array = GetArrayValues(values, properties[i]);
                    if (array != null)
                    {
                        SetValue(item, array, type, properties[i]);
                    }
                }
                else
                {
                    var value = RemoveQuotes(values[i]);
                    SetValue(item, value, type, properties[i]);
                }
            }

            return item;
        }

        /// <summary>
        /// Get rows from csv file.
        /// </summary>
        /// <param name="stream">File stream.</param>
        /// <returns>Collection of csv rows.</returns>
        public IEnumerable<string> GetCsvRows(Stream stream)
        {
            // TextFieldParser
            var csvRows = new List<string>();

            using (var reader = new StreamReader(stream, Encoding.GetEncoding(1252)))
            {
                var csvContent = reader.ReadToEnd();

                MatchEvaluator evaluator = content => content.Value.Replace(Environment.NewLine, string.Empty).Replace("\r", string.Empty);
                csvContent = Regex.Replace(csvContent, "\"[^\"]*(?:\"\"[^\"]*)*\"", evaluator);

                csvRows = csvContent.Split(new[] { Environment.NewLine, "\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            }

            return csvRows;
        }

        /// <summary>
        /// Get csv configuration.
        /// </summary>
        /// <param name="fileParameters">File parameters.</param>
        /// <returns>Csv file. configuration.</returns>
        private CsvHelper.Configuration.Configuration GetConfiguration(FileParameters fileParameters)
        {
            return new CsvHelper.Configuration.Configuration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = fileParameters.HasHeaderRecord,
                HeaderValidated = null,
                MissingFieldFound = null,
                Delimiter = fileParameters.FileDataDelimiter
            };
        }

        /// <summary>
        /// Adding spaces to sentence.
        /// </summary>
        /// <param name="text">Input text.</param>
        /// <returns>Result text.</returns>
        private string AddSpacesToSentence(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var newText = new StringBuilder(text.Length * 2);
            newText.Append(text[0]);

            for (var i = 1; i < text.Length; i++)
            {
                if (char.IsUpper(text[i]) && text[i - 1] != ' ')
                {
                    newText.Append(' ');
                }

                newText.Append(text[i]);
            }

            return newText.ToString();
        }

        /// <summary>
        /// Get array values from file row.
        /// </summary>
        /// <param name="values">Collection of column values.</param>
        /// <param name="arrayProperty">Array property info.</param>
        /// <returns>Object array.</returns>
        private object GetArrayValues(string[] values, PropertyInfo arrayProperty)
        {
            if (!arrayProperty.PropertyType.IsArray)
            {
                return null;
            }

            var arrayType = arrayProperty.PropertyType.GetElementType();
            var listtype = typeof(List<>).MakeGenericType(arrayType);
            IList list = (IList)Activator.CreateInstance(listtype);

            var properties = GetProperties(arrayType);
            while (values.Length > 0)
            {
                var obj = CreateFromType(arrayType, values);
                list.Add(obj);
                int offset = properties.Length;
                values = values.Skip(offset).Take(values.Length - offset).ToArray();
            }

            var arrayMethod = typeof(Enumerable).GetMethod("ToArray").MakeGenericMethod(arrayType);

            return list.Count > 0 ? arrayMethod.Invoke(null, new[] { list }) : null;
        }

        /// <summary>
        /// Create object by type and set properties to the object.
        /// </summary>
        /// <param name="type">Object type.</param>
        /// <param name="values">Collection of column values.</param>
        /// <returns>Object of specified type.</returns>
        private object CreateFromType(Type type, string[] values)
        {
            var item = Activator.CreateInstance(type);
            var properties = GetProperties(type);

            int length = values.Length < properties.Length ? values.Length : properties.Length;
            for (var i = 0; i < length; i++)
            {
                var value = RemoveQuotes(values[i]);
                SetValue(item, value, type, properties[i]);
            }

            return item;
        }

        /// <summary>
        /// Get properties from the type.
        /// </summary>
        /// <param name="type">Type.</param>
        /// <returns>Collections of properties info.</returns>
        private PropertyInfo[] GetProperties(Type type)
        {
            var currentTypeProperties = type.GetProperties()
               .Where(x => !x.GetCustomAttributes(false).Any(attribute => attribute is IgnoreCsvColumnAttribute))
               .Where(x => !type.BaseType.GetProperties().Any(prop => prop.Name.Equals(x.Name, StringComparison.InvariantCultureIgnoreCase)));
            var properties = type.BaseType.GetProperties().Concat(currentTypeProperties).ToArray();

            return properties;
        }

        /// <summary>
        /// Set value to properties.
        /// </summary>
        /// <param name="item">Object of specified type.</param>
        /// <param name="value">Value.</param>
        /// <param name="type">Type of the object.</param>
        /// <param name="property">Property of the object.</param>
        private void SetValue(object item, object value, Type type, PropertyInfo property)
        {
            var prop = type.GetProperty(property.Name);
            if (prop != null)
            {
                prop.SetValue(item, value);
            }
        }

        /// <summary>
        /// Remove quotes.
        /// </summary>
        /// <param name="value">String value.</param>
        /// <returns>Value without quotes.</returns>
        private string RemoveQuotes(string value)
        {
            // remove first and last quote if exist
            if (value.StartsWith("\"") && value.EndsWith("\""))
            {
                value = value.Substring(1, value.Length - 2);
            }

            return value;
        }
    }
}
