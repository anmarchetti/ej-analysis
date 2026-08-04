using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions.Payment;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace easyJet.Holidays.Api.Domain.CustomJsonConverters;

/// <summary>
/// Converts PaymentInfo into specific payment info by types: card, apple-pay..
/// </summary>
public class PaymentInfoConverter : JsonConverter<PaymentInfo>
{
    /// <inheritdoc />
    public override PaymentInfo ReadJson(JsonReader reader, Type objectType, PaymentInfo existingValue,
        bool hasExistingValue, JsonSerializer serializer)
    {
        ArgumentNullException.ThrowIfNull(serializer);
        ArgumentNullException.ThrowIfNull(reader);
        
        if (reader.TokenType == JsonToken.Null)
        {
            return null;
        }

        JObject jsonObject = JObject.Load(reader);

        PaymentInfo paymentInfo;
        string paymentType = jsonObject["paymentType"]?.ToString();
        if (string.IsNullOrEmpty(paymentType))
        {
            paymentInfo = new CardPaymentInfo();
        }
        else if (Enum.TryParse(paymentType, out PaymentType paymentTypeValue))
        {
            paymentInfo = paymentTypeValue switch
            {
                PaymentType.ApplePay => new ApplePayPaymentInfo(),
                PaymentType.CreditDebitCard => new CardPaymentInfo(),
                _ => throw new InvalidPaymentTypeException($"Non implemented paymentType '{paymentTypeValue}'")
            };
        }
        else
        {
            throw new InvalidPaymentTypeException($"Invalid paymentType '{paymentType}'");
        }

        // Populate the chosen type from JSON
        serializer.Populate(jsonObject.CreateReader(), paymentInfo);
        return paymentInfo;
    }

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, PaymentInfo value, JsonSerializer serializer)
    {
        ArgumentNullException.ThrowIfNull(writer);
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(serializer);

        serializer.Serialize(writer, value);
    }
}