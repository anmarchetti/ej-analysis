using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using easyJet.Feature.Tracker.Commands;
using easyJet.Feature.Tracker.Models.Dflo;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Services;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.Extensions;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class SyncDfloDataTests
    {
        private readonly IDfloService dfloServiceMock;
        private readonly IAwsDynamoDbRepository<EmailMessageAwsDbModel> dynamoDbRepoMock;
        private readonly IXdbService xdbServiceMock;
        private readonly SyncDfloData sut;
        private readonly IUserCreationService userCreationService;

        public SyncDfloDataTests()
        {
            dfloServiceMock = Substitute.For<IDfloService>();
            dynamoDbRepoMock = Substitute.For<IAwsDynamoDbRepository<EmailMessageAwsDbModel>>();
            xdbServiceMock = Substitute.For<IXdbService>();
            userCreationService = Substitute.For<IUserCreationService>();
            sut = Substitute.ForPartsOf<SyncDfloData>(dfloServiceMock, dynamoDbRepoMock, xdbServiceMock, userCreationService);
        }

        [Fact]
        public async void SyncData_OnFailedDataRetrievalFromDynamoDB_ReturnsWithoutFurtherAction()
        {
            // Arrange
            dynamoDbRepoMock.GetAll().Throws(new Exception());

            // Act
            await sut.SyncData();

            // Assert
            await dynamoDbRepoMock.Received(1).GetAll();
            xdbServiceMock.DidNotReceive().GetContactsQuery();
            await dfloServiceMock.DidNotReceiveWithAnyArgs().GetEmailsByEmailAsync(default);
        }

        [Fact]
        public async void SyncData_OnSuccessfulRetrievalFromDynamoDB_ProcessesContacts()
        {
            // Arrange
            var alreadyProcessedId = Guid.NewGuid();
            var alreadyProcessedEmail = "already@process.ed";
            var unprocessedId = Guid.NewGuid();
            var unprocessedEmail = "notyet@process.ed";
            dynamoDbRepoMock.GetAll().Returns(new List<EmailMessageAwsDbModel>()
            {
                new EmailMessageAwsDbModel() { ContactId = alreadyProcessedId.ToString() }
            });
            var mockQueryEnumerator = Substitute.For<IAsyncEntityBatchEnumerator<Contact>>();
            mockQueryEnumerator.MoveNextAsync().Returns(true, false);

            var unprocessedContact = new Contact();
            SetIdAndFacetOnContact(unprocessedContact, unprocessedId, (new EmailAddress(unprocessedEmail, true), unprocessedEmail.Split('@').First()));
            var processedContact = new Contact();
            SetIdAndFacetOnContact(processedContact, alreadyProcessedId, (new EmailAddress(alreadyProcessedEmail, true), alreadyProcessedEmail.Split('@').First()));

            mockQueryEnumerator.Current.Returns(new ReadOnlyCollection<Contact>(new List<Contact>()
            {
                unprocessedContact,
                processedContact
            }));

            sut.Configure().When(mock => mock.GetEnumerator()).DoNotCallBase();
            sut.Configure().GetEnumerator().Returns(mockQueryEnumerator);

            var dateOfMail = DateTime.Now.AddDays(-1);

            var mailsByMail = new Dictionary<string, IEnumerable<Document>>()
            {
                {
                    unprocessedEmail, new List<Document>()
                    {
                        new Document() { Id = Guid.NewGuid().ToString(), DateStored = dateOfMail, Subject = "a" },
                        new Document() { Id = Guid.NewGuid().ToString(), DateStored = dateOfMail, Subject = "b" }
                    }
                }
            };

            dfloServiceMock.GetEmailsByEmailAsync(default).ReturnsForAnyArgs(mailsByMail);

            // Act
            await sut.SyncData();

            // Assert
            await dynamoDbRepoMock.Received().SaveBatchAsync(Arg.Is<List<EmailMessageAwsDbModel>>(arg => arg.Count == mailsByMail.Values.First().Count()), Arg.Any<int>(), Arg.Any<int>());
            await mockQueryEnumerator.Received(2).MoveNextAsync();
            _ = mockQueryEnumerator.Received(1).Current;

            // locals
#pragma warning disable SA1123
            #region locals
#pragma warning restore SA1123
            void SetIdAndFacetOnContact(Contact contact, Guid guid, (EmailAddress email, string key) emailKeyTpl)
            {
#pragma warning disable SA1119
                (typeof(Contact))?.BaseType?.GetProperty("Id")?.SetValue(contact, guid);
#pragma warning restore SA1119

                var internalMap = new Dictionary<string, Facet>()
                {
                    { EmailAddressList.DefaultFacetKey, new EmailAddressList(emailKeyTpl.email, emailKeyTpl.key) }
                };
#pragma warning disable SA1119
                (typeof(Contact))?.BaseType?.GetProperty("FacetMap", BindingFlags.Instance | BindingFlags.NonPublic)?.SetValue(contact, internalMap);
#pragma warning restore SA1119
            }
            #endregion
        }
    }
}
