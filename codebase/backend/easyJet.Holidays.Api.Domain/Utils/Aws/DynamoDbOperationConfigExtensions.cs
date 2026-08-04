#nullable enable
using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Utils.Aws;

/// <summary>
/// AWS SDK for .NET v4 has split a bloated <see cref="DynamoDBOperationConfig"/> into
/// multiple, operation specific config classes. This class holds helper methods to convert from
/// the old, general config to the new, specialized ones. <br />
/// Refer to: https://github.com/aws/aws-sdk-net/pull/3421, for further reading.
/// </summary>
public static class DynamoDbOperationConfigExtensions
{
    /// <summary>
    /// Converts to <see cref="FromScanConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static FromScanConfig ConvertToFromScanConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName,
        };
    }

    /// <summary>
    /// Converts to <see cref="BatchWriteConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static BatchWriteConfig ConvertToBatchWriteConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName,
            Conversion = instance.Conversion
        };
    }

    /// <summary>
    /// Converts to <see cref="LoadConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static LoadConfig ConvertToLoadConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName
        };
    }

    /// <summary>
    /// Converts to <see cref="QueryConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static QueryConfig ConvertToQueryConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName,
            ConsistentRead = instance.ConsistentRead
        };
    }

    /// <summary>
    /// Converts to <see cref="BatchGetConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static BatchGetConfig ConvertToBatchGetConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName
        };
    }

    /// <summary>
    /// Converts to <see cref="SaveConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static SaveConfig ConvertToSaveConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName
        };
    }

    /// <summary>
    /// Converts to <see cref="DeleteConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static DeleteConfig ConvertToDeleteConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName
        };
    }

    /// <summary>
    /// Converts to <see cref="FromQueryConfig"/>
    /// </summary>
    /// <param name="instance"></param>
    /// <returns></returns>
    public static FromQueryConfig ConvertToFromQueryConfig(this DynamoDBOperationConfig instance)
    {
        return new()
        {
            OverrideTableName = instance.OverrideTableName
        };
    }
}