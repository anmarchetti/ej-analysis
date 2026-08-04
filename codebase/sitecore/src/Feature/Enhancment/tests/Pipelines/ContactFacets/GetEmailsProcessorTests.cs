using System;
using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.EmailsList;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using FluentAssertions;
using NSubstitute;
using Sitecore.Cintel.Reporting;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class GetEmailsProcessorTests
    {
        private readonly IAwsDynamoDbRepository<EmailMessageAwsDbModel> repository;
        private readonly GetEmailsProcessor processor;
        private readonly ConstructEmailsDataTableProcessor constructTableProcessor;

        public GetEmailsProcessorTests()
        {
            repository = Substitute.For<IAwsDynamoDbRepository<EmailMessageAwsDbModel>>();
            processor = new GetEmailsProcessor(repository);
            constructTableProcessor = new ConstructEmailsDataTableProcessor();
        }

        [Fact]
        public void FillContactEmailTable_TableIsEmpty_EmailsAreEmpty()
        {
            var args = InitArgs();
            repository.Get(Arg.Any<string>()).Returns(new List<EmailMessageAwsDbModel>());

            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Should().BeEmpty();
        }

        [Fact]
        public void FillContactEmailTable_TableNotEmpty_EmailsAreExist()
        {
            var args = InitArgs();
            repository.Get(Arg.Any<string>()).Returns(new List<EmailMessageAwsDbModel>() { new EmailMessageAwsDbModel() });

            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Count.Should().Be(1);
        }

        private ReportProcessorArgs InitArgs()
        {
            var args = new ReportProcessorArgs(new ViewParameters { ViewName = "test table name" })
            {
                ReportParameters =
                {
                    ContactId = Guid.NewGuid()
                }
            };
            constructTableProcessor.Process(args);
            return args;
        }
    }
}
