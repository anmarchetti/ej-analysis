using System;
using System.Reflection;
using Amazon.DynamoDBv2.DataModel;
using easyJet.Foundation.DynamoDb.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.DynamoDb.Tests.Models
{
    public class SingleUsePromocodeModelTests
    {
        [Fact]
        public void Code_IsDynamoDbRangeKey()
        {
            var attribute = GetAttribute<DynamoDBRangeKeyAttribute>(nameof(SingleUsePromocodeModel.Code));

            attribute.Should().NotBeNull();
            GetAttributeName(attribute).Should().Be("code");
        }

        [Fact]
        public void Code_IsNotDynamoDbHashKey()
        {
            var attribute = GetAttribute<DynamoDBHashKeyAttribute>(nameof(SingleUsePromocodeModel.Code));

            attribute.Should().BeNull();
        }

        [Fact]
        public void CampaignId_IsDynamoDbHashKey()
        {
            var attribute = GetAttribute<DynamoDBHashKeyAttribute>(nameof(SingleUsePromocodeModel.CampaignId));

            attribute.Should().NotBeNull();
            GetAttributeName(attribute).Should().Be("campaignId");
        }

        [Fact]
        public void CampaignId_IsNotDynamoDbRangeKey()
        {
            var attribute = GetAttribute<DynamoDBRangeKeyAttribute>(nameof(SingleUsePromocodeModel.CampaignId));

            attribute.Should().BeNull();
        }

        [Fact]
        public void Properties_ShouldReturnAssignedValues()
        {
            var model = new SingleUsePromocodeModel
            {
                CampaignId = "CampaignName",
                Code = "Code1"
            };

            model.CampaignId.Should().Be("CampaignName");
            model.Code.Should().Be("Code1");
        }

        private static TAttribute GetAttribute<TAttribute>(string propertyName)
            where TAttribute : Attribute
        {
            return typeof(SingleUsePromocodeModel)
                .GetProperty(propertyName)
                .GetCustomAttribute<TAttribute>();
        }

        private static object GetAttributeName(Attribute attribute)
        {
            return attribute.GetType().GetProperty("AttributeName").GetValue(attribute);
        }
    }
}