<#
.SYNOPSIS

Exchanges credits

.DESCRIPTION

Converts customer credits to different currency based on fixed exchange rates

.PARAMETER File
File containing users' emails and target currency
Example:
Email	            Currency
user1@reply.com	    GBP

.OUTPUTS

New voucher codes with target currency

.EXAMPLE
For Preprod directory:
PS> .\ExchangeCredits.ps1 -File .\data.csv -AppId 57e5ccb2-9108-46d1-a187-7696a94546ec -AppToken 8477b6a8-6fd0-4480-af98-623e3bf87439
#>
[CmdletBinding()]
Param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$File,
    
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Reason,
    
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$AppId,
    
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$AppToken
)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$baseUri = 'https://deu4.api.voucherify.io/v1';
$apiHeaders = @{
    'Content-Type' = 'application/json'; 
    'X-App-Id'     = $AppId;
    'X-App-Token'  = $AppToken;
}
$allCurrencyCodes = 'GBP', 'CHF', 'EUR'
$exchangeRates = @{
    "GBP_CHF" = 1.11    #GBP <-> CHF  1 : 1.11
    "GBP_EUR" = 1.13    #GBP <-> EUR  1 : 1.13
    "CHF_EUR" = 1.018   #CHF <-> EUR  1 : 1.018
}
$emailColumnName = "Email"
$currencyColumnName = "Currency To"

function isValidEmail { 
    param([string]$EmailAddress)

    try {
        $null = [mailaddress]$EmailAddress
        return $true
    }
    catch {
        return $false
    }
}

function isValidCurrency {
    param([string]$Currency)

    return $allCurrencyCodes.Contains($Currency)
}

function getCustomer($email) {    
    $uri = "$baseUri/customers?email=$email"
        
    $responsesRaw = Invoke-WebRequest $uri -Headers $apiHeaders -UseBasicParsing
    $customers = ConvertFrom-Json $([String]::new($responsesRaw.Content))

    if (-not($null -eq $customers.customers[0].SourceId)) {
        return $customers.customers[0].SourceId
    }

    return $customers.customers[0].Id
}

function fetchVouchers($customer, $createdAfter) {    
    $allVouchers = @();
    $limit = 100     
    $page = 1
    $totalPages = 1
    while ($page -le $totalPages) {
        $fetchUri = "$baseUri/vouchers?limit=$limit&page=$page&customer=$customer&[created_at][after]=$createdAfter&[filters][active][conditions][`$active]=true&[filters][junction]=and"

        $vouchersRaw = Invoke-WebRequest $fetchUri -Headers $apiHeaders  -UseBasicParsing
        $vouchers = ConvertFrom-Json $([String]::new($vouchersRaw.Content))
        $allVouchers += $vouchers.vouchers

        # update total pages on each request, why not?
        $totalPages = [int][Math]::Ceiling($vouchers.total / $limit)
        Write-Host "Fetched $page / $totalPages, $fetchUri"        
        $page++        
    }

    return $allVouchers
}

function convertCredits($amount, $fromCurrency, $toCurrency) {
    $conversionKey = "${fromCurrency}_${toCurrency}"
    if ($exchangeRates.ContainsKey($conversionKey)) {
        $rate = $exchangeRates[$conversionKey]
        $convertedAmount = $amount * $rate
        return $convertedAmount
    }
    
    $conversionKey = "${toCurrency}_${fromCurrency}"
    if ($exchangeRates.ContainsKey($conversionKey)) {
        $rate = $exchangeRates[$conversionKey]
        $convertedAmount = $amount / $rate
        return [int][Math]::Round($convertedAmount)
    }

    throw "Unsupported currency conversion: ${fromCurrency} to ${toCurrency}"
}

function prepareConvertedVoucher($voucher, $toCurrency) {
    $fromCurrency = $voucher.metadata.currency
    $amount = convertCredits $voucher.gift.balance $fromCurrency $toCurrency

    return  @"
{
    "category": "$($voucher.category)",
    "campaign": "$($voucher.campaign)",
    "type": "$($voucher.type)",
    "gift": {
        "amount": $amount
    },
    "expiration_date": "$($voucher.expiration_date)",
    "metadata": {
        "reason": "$($voucher.metadata.reason)",
        "source": "$($voucher.metadata.source)",
        "currency": "$toCurrency",
        "action": "Currency conversion",
        "previousVoucherId": "$($voucher.id)"
    },
    "redemption": {
        "quantity": null
    }
}
"@
}

function createVoucher($voucherBody) {
    $uri = "$baseUri/vouchers"
    
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Post -Body $voucherBody -UseBasicParsing
    return $resp.code;
}

function publishVoucher($voucherCode, $customerId) {
    $uri = "$baseUri/vouchers/publish"
    $body = @"
{
    "voucher": "$voucherCode",
    "customer": {
        "id": "$customerId"
    }
}

"@
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Post -Body $body    
}

function reedemVoucher($voucher) {
    $uri = "$baseUri/vouchers/$($voucher.id)/redemption"
    $body = @"
{
	"order": {
		"amount": "$($voucher.gift.balance)"
    },
	"metadata": {        
        "reason": "Currency conversion script"
    }
}
"@
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Post -Body $body -UseBasicParsing
    $redemption = ConvertFrom-Json $([String]::new($responsesRaw.Content))
    return $redemption.id;
}

function rollbackRedemption($redemptionId) {
    $reason = [System.Uri]::EscapeDataString("Currency conversion failed")
    $uri = "$baseUri/redemptions/$redemptionId/rollback?reason=$reason"
    
    $resp = Invoke-WebRequest $uri -Headers $apiHeaders -Method Post -UseBasicParsing
}

function startOfYear() {
    $currentDate = Get-Date
    $currentYear = $currentDate.Year
    return Get-Date -Year $currentYear -Month 1 -Day 1 -Hour 0 -Minute 0 -Second 0 -Millisecond 0 -Format "yyyy-MM-ddTHH:mm:ssZ"
}

$rows = import-csv $File

$i = 1
$total = $rows.Count
if ($null -eq $total) {
    $total = 1
}

$startOfYear = startOfYear

foreach ($row in $rows) {
    Write-Host -NoNewline "$i of ($total): $row   "

    try {
        $originalEmail = $row.$emailColumnName
        $currency = $row.$currencyColumnName
		
        if (-not(isValidEmail $originalEmail)) {
            throw "Email: $originalEmail is invalid, will be skipped!"
        }
		
        if ([string]::IsNullOrWhiteSpace($currency) -or -not(isValidCurrency $currency)) {
            throw "Currency: $currency is invalid, will be skipped!"
        }
		
        $email = $originalEmail.ToLower()
        $customerId = getCustomer $email
		
        if ($null -eq $customerId) {
            throw "Cannot find customer with email $originalEmail"
        }

        $vouchers = fetchVouchers $customerId $startOfYear

        foreach ($voucher in $vouchers) {
            if ($voucher.gift.balance -eq 0) { continue }
            if ($voucher.metadata.currency -eq $currency) { continue }
            if (-not($voucher.metadata.reason -eq $Reason)) { continue }

            $redemptionId = $null

            try {
                $voucherBody = prepareConvertedVoucher $voucher $currency
                $redemptionId = reedemVoucher $voucher
                $voucherCode = createVoucher $voucherBody
                publishVoucher $voucherCode $customerId
                
                Write-Host "`nConverted voucher: $($voucher.code) for: $originalEmail. New voucher: $voucherCode" -ForegroundColor green
            }
            catch {
                Write-Host "`nERROR: Failed to Convert voucher: $($voucher.code): $_" -ForegroundColor red
                
                if (-not($null -eq $redemptionId)) {
                    Write-Host "`nWARNING: Rolling back redemption: $redemptionId" -ForegroundColor yellow
                    rollbackRedemption $redemptionId
                }
            }
        }
    }
    catch {
        Write-Host "`nERROR: Cannot convert credits to $($currency) for $($originalEmail): $_" -ForegroundColor red
    }
}

Write-Host "Done."