namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

internal interface INoTaxCalculator
{
    OfferTax Calculate(TouristTaxOffer offer);
}

internal sealed class NoTaxCalculator : INoTaxCalculator
{
    // Accomodation Amount  * Percentage Rate  OR  Cap  
    public OfferTax Calculate(TouristTaxOffer offer)
    {
        var offerTax = new OfferTax(offer.OfferId);
        offerTax.TouristTax = 0;
        offerTax.TouristTaxPP = 0;
        offerTax.TouristTaxPPLocal = 0;
        offerTax.TouristTaxLocal = 0;
        offerTax.ExchangeRate = 0;
        offerTax.Currency = "NoTax";
        return offerTax;
    }
}
