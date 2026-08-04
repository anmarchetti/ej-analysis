using easyJet.Feature.PageContent.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Services
{
    public class SchemaFactoryTests
    {
        private readonly SchemaFactory schemaFactory;

        public SchemaFactoryTests()
        {
            schemaFactory = new SchemaFactory();
        }

        [Theory]
        [AutoDbData]
        public void GetSchema_ShouldReturnNull_IfItemIsNotQuestionsAndAnswersFolder(Db db, string expectedType)
        {
            // Arrange
            var dbItem = new DbItem("Item 1");
            db.Add(dbItem);

            using (new SettingsSwitcher("PageContent.QuestionsAndAnswers.TypeName", expectedType))
            {
                // Act
                var act = schemaFactory.GetSchema(db.GetItem(dbItem.ID));

                // Assert
                act.Should().BeNull();
            }
        }

        [Theory]
        [AutoDbData]
        public void GetSchema_ShouldGetSchema_IfQuestionAndAnswerItemsExistinng(Db db, string expectedQuestion, string expectedAnswer)
        {
            // Arrange
            var questionsAndAnswersFolderDbItem = new DbItem("Question And Answers", ID.NewID, Constants.TemplateIds.QuestionsAndAnswersFolder);
            var questionAndAnswer = new DbItem("Question And Answer", ID.NewID, Constants.TemplateIds.QuestionAndAnswer);
            questionAndAnswer.Fields.Add(Constants.Fields.QuestionAndAnswer.Question, expectedQuestion);
            questionAndAnswer.Fields.Add(Constants.Fields.QuestionAndAnswer.Answer, expectedAnswer);
            questionsAndAnswersFolderDbItem.Children.Add(questionAndAnswer);
            db.Add(questionsAndAnswersFolderDbItem);

            // Act
            var act = schemaFactory.GetSchema(db.GetItem(questionsAndAnswersFolderDbItem.ID));

            // Assert
            act.Type.Should().BeEquivalentTo("FAQPage");
            act.MainEntity.HasOne.Should().BeTrue();
        }
    }
}
