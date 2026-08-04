using System;
using System.Collections.Generic;
using System.Reflection;
using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.ChatBotMessages;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.XConnect.Common.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Cintel.Reporting;
using Sitecore.XConnect;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class GetChatBotMessagesProcessorTests
    {
        private readonly IAwsDynamoDbRepository<LiveChatMessageAwsDbModel> repository;
        private readonly IXdbService xdbService;
        private readonly GetChatBotMessagesProcessor processor;
        private readonly ConstructChatBotMessagesDataTableProcessor constructTableProcessor;

        public GetChatBotMessagesProcessorTests()
        {
            repository = Substitute.For<IAwsDynamoDbRepository<LiveChatMessageAwsDbModel>>();
            xdbService = Substitute.For<IXdbService>();
            processor = new GetChatBotMessagesProcessor(repository, xdbService);
            constructTableProcessor = new ConstructChatBotMessagesDataTableProcessor();
        }

        [Fact]
        public void GetBookingsChatBotMessagesTable_TableIsEmpty_ContactIsNull()
        {
            var args = InitArgs();
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns((Contact)null);
            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Should().BeEmpty();
        }

        [Fact]
        public void ChatBotMessagesTable_TableIsEmpty_InteractionsAreEmpty()
        {
            var args = InitArgs();
            var contact = GetContactWithInteractions(true);
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns(contact);
            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Should().BeEmpty();
        }

        [Fact]
        public void ChatBotMessagesTable_TableIsEmpty_AwsTableIsEmpty()
        {
            var args = InitArgs();
            var contact = GetContactWithInteractions(false);
            repository.Get(Arg.Any<string>()).Returns(new List<LiveChatMessageAwsDbModel>());
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns(contact);
            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Should().BeEmpty();
        }

        [Fact]
        public void ChatBotMessagesTable_TableNotEmpty_ContactHasInteractions()
        {
            var args = InitArgs();
            var contact = GetContactWithInteractions(false);
            repository.Get(Arg.Any<string>()).Returns(new List<LiveChatMessageAwsDbModel>() { new LiveChatMessageAwsDbModel() });
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns(contact);
            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Count.Should().Be(1);
        }

        private Contact GetContactWithInteractions(bool interactionsAreEmpty)
        {
            var contact = new Contact();
            var property = contact.GetType().GetProperty("Interactions", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (property != null)
            {
                property.SetValue(contact, GetInteractions(interactionsAreEmpty));
            }

            return contact;
        }

        private IReadOnlyCollection<Interaction> GetInteractions(bool interactionsAreEmpty)
        {
            return interactionsAreEmpty ? new List<Interaction>() : new List<Interaction>()
            {
                new Interaction(new Contact(), InteractionInitiator.Contact, Guid.NewGuid(), "test") { DeviceProfile = new DeviceProfile(Guid.NewGuid()) },
            };
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
