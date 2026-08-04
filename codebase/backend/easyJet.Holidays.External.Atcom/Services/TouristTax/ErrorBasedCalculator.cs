namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface IErrorBasedCalculator
{
    OfferTax Calculate(string offerId);
}

internal sealed class ErrorBasedCalculator : IErrorBasedCalculator
{
    public OfferTax Calculate(string offerId)
    {
        // Return sentinel values to indicate an error in configuration/calculation
        var offerTax = new OfferTax(offerId);
        offerTax.TouristTax = -1;
        offerTax.TouristTaxPP = -1;
        offerTax.TouristTaxLocal = -1;
        offerTax.TouristTaxPPLocal = -1;
        offerTax.ExchangeRate = -1;
        offerTax.Currency = "err";
        return offerTax;
    }
}
