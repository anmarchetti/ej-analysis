using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.EmailsList
{
    public class GetEmailsProcessor : ReportProcessorBase
    {
        private readonly IAwsDynamoDbRepository<EmailMessageAwsDbModel> repository;

        public GetEmailsProcessor(IAwsDynamoDbRepository<EmailMessageAwsDbModel> repository)
        {
            this.repository = repository;
        }

        public override void Process(ReportProcessorArgs args)
        {
            var contactId = args.ReportParameters.ContactId.ToString();
            var resultTableForView = args.ResultTableForView;
            IEnumerable<EmailMessageAwsDbModel> emails = null;

            var taskResponse = Task.Run(async () => await repository.Get(contactId).ConfigureAwait(false));
            var continuation = taskResponse.ContinueWith(t => emails = t.Result);
            continuation.Wait();

            if (emails != null)
            {
                foreach (var email in emails)
                {
                    var dataRow = resultTableForView.NewRow();

                    var unpackedBody = UnpackBody(email.Body);

                    dataRow["SentDate"] = email.SentDate;
                    dataRow["Subject"] = email.Subject;
                    dataRow["Body"] = unpackedBody;
                    dataRow["BodyPreview"] = GetBodyPreview(unpackedBody);
                    dataRow["Id"] = email.EmailId;
                    resultTableForView.Rows.Add(dataRow);
                }
            }

            args.QueryResult = resultTableForView;
        }

        public string GetBodyPreview(string body)
        {
            if (body == null)
            {
                return string.Empty;
            }

            return body.Length >= 40 ? body.Substring(0, 40) : body;
        }

        private static string UnpackBody(string body)
        {
            if (string.IsNullOrEmpty(body))
            {
                return null;
            }

            // is raw
            if (body.StartsWith("<!DOCTYPE"))
            {
                return body;
            }

            var bytes = Convert.FromBase64String(body);
            var stream = new MemoryStream(bytes);

            return FromGzipMemoryStream(stream);
        }

        private static string FromGzipMemoryStream(MemoryStream stream)
        {
            using (var zipStream = new GZipStream(stream, CompressionMode.Decompress))
            using (var reader = new StreamReader(zipStream))
            {
                return reader.ReadToEnd();
            }
        }
    }
}