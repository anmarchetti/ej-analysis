using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;

namespace easyJet.Holidays.Api.Domain.Utils.Aws;

internal class EnumConverter<T> : IPropertyConverter where T : struct, IConvertible
{
    public object FromEntry(DynamoDBEntry entry)
    {
        var primitive = entry as Primitive;

        if (!(primitive?.Value is string) || string.IsNullOrEmpty((string)primitive.Value))
            throw new ArgumentOutOfRangeException();

        var tryParse = Enum.TryParse<T>((string)primitive.Value, out var parsedValue);

        if (!tryParse)
        {
            throw new ArgumentException();
        }

        return parsedValue;
    }

    public DynamoDBEntry ToEntry(object value)
    {
        var enumValue = value as Enum;

        if (enumValue == null) throw new ArgumentOutOfRangeException();

        DynamoDBEntry entry = new Primitive
        {
            Value = value.ToString()
        };

        return entry;
    }
}

internal class BooleanConverter : IPropertyConverter
{
    public DynamoDBEntry ToEntry(object value)
    {
        var entry = new Primitive(((bool)value).ToString().ToLower());
        return entry;
    }

    public object FromEntry(DynamoDBEntry entry)
    {
        var primitive = entry as Primitive;
        var success = bool.TryParse((string)primitive?.Value, out var value);
        if (!success)
        {
            throw new ArgumentException("incoming value cannot be converted to boolean");
        }

        return value;
    }
}