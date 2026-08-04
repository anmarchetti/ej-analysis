<#
.SYNOPSIS

Create gift cards vouchers

.DESCRIPTION

{
    reason: "Vouchers - Marketing",
    source: "Walker Crisps",
    currency: "GBP",    
}

.PARAMETER Source
Issue source

.PARAMETER Campaign
Campaign to associate with

.OUTPUTS

Vouchers

.EXAMPLE
For Test directory:
PS> .\CreateGiftVouchers.ps1 -File "input.csv" -Source "Script" -Campaign "Test Gift Cards" -Reason "Vouchers - InternalPromo" -AppId 00f325ae-a274-4d09-b72e-c62b0aeb6903 -AppToken c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca
#>

[CmdletBinding()]
Param(
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$File,

	[Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$Source,
    
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$Campaign,
	
	[Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$Reason,
    
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$AppId,
    
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$AppToken
)

<#
$File = 'input.csv'
$Source = 'From Script'
$Campaign = "Test Gift Cards"
$AppId = "00f325ae-a274-4d09-b72e-c62b0aeb6903"
$AppToken = "c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca"
$Reason = "Vouchers - InternalPromo"
#>

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$baseUri = 'https://deu4.api.voucherify.io/v1';
$apiHeaders = @{
    'Content-Type' = 'application/json'; 
    'X-App-Id' = $AppId;
    'X-App-Token' = $AppToken;
}

function IsValidEmail { 
    param([string]$EmailAddress)

    try {
        $null = [mailaddress]$EmailAddress
        return $true
    }
    catch {
        return $false
    }
}

function IsDecimal($value){
    try{
        [decimal]$value | Out-Null
        $true
    }
	catch {
        $false
    }
}

function getCustomer($email) {    
    $uri = "$baseUri/customers?email=$email"
        
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders -UseBasicParsing
    $customers = ConvertFrom-Json $([String]::new($responsesRaw.Content))

    return $customers.customers[0].id
}


function createCustomer($email) {    
    $uri = "$baseUri/customers"
    $body = @"
{
	"name": "$email",
	"email": "$email",
    "metadata": {
        "lang": "en"
    }
}
"@
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Post -Body $body -UseBasicParsing   
    return $resp.id
}


function createVoucher($amount, $reasonCode, $expirationDate, $source) {

    $uri = "$baseUri/vouchers"
    $body = @"
{
    "code_config": {
        "pattern": "######-$Campaign"
    },
    "category": "ej Holidays",
    "campaign": "$Campaign",
    "type": "GIFT_VOUCHER",
    "gift": {
        "amount": $amount
    },
    "expiration_date": "$expirationDate",
    "metadata": {        
        "reason": "$reasonCode",
        "source": "$source",
        "currency": "GBP"
    },
    "redemption": {
        "quantity": null
    }
}
"@
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Post -Body $body -UseBasicParsing
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
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Post -Body $body -UseBasicParsing
}


#Columns: Email,Amount,ExpirationDate
$rows = import-csv $File

$i = 1
$total = $rows.Count
if($total -eq $null) {
    $total = 1
}

#store already processed email (in previous cycle iteration)
$handledEmail = ""
$newCustomerWasCreated = $false

foreach($row in $rows) {
    Write-Host -NoNewline "$i of ($total): $row   "

    try {
		
		$originalEmail = $row.Email
		$amount = $row.Amount
		
		if(-not(IsValidEmail $originalEmail))
		{
			throw "Email: $originalEmail is invalid, will be skipped!"
		}
		
		if([string]::IsNullOrWhiteSpace($amount) -or -not(IsDecimal $amount))
		{
			throw "Amount: $amount is invalid, will be skipped!"
		}
		
        $email = $originalEmail.ToLower()
		
        # validate expiration date
        $expDate = ([DateTime]$row.ExpirationDate)

		if($email -eq $handledEmail -and $newCustomerWasCreated){
			
			#obligatory waiting for the creation of a new customer in previous iteration to avoid dublicates
			start-Sleep -Seconds 5
		}

        # Get or create vustomer
        $customerId = getCustomer $email
		
        if($customerId -eq $null) {
            $customerId = createCustomer $email
			$newCustomerWasCreated = $true
        }
		else
		{
			$newCustomerWasCreated = $false
		}

        if($customerId -eq $null) {
            throw "Cannot find or create customer with email $originalEmail"
        }
		
		$handledEmail = $email

        # Create and publish voucher
        $voucherCode = createVoucher (+$amount * 100) $Reason $row.ExpirationDate $Source

        publishVoucher $voucherCode $customerId
        
        Write-Host "`nCreated voucher: $voucherCode with amount: $amount for: $originalEmail" -ForegroundColor green
    } catch {
        Write-Host "`nERROR: Cannot create voucher for $($row.Email): $_" -ForegroundColor red
    } 
    $i++       
}

Write-Host "Done."