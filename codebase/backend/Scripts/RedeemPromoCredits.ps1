<#
.OUTPUTS
CSV file with information about the redeemed vouchers: user ID and email, voucher ID and amount, redemption ID

.EXAMPLE
Input CSV file should contain only one column with user emails.

PS> .\RedeemPromoCredits.ps1 -File "input.csv" -Source "Script" -Reason "Vouchers - InternalPromo" -AppId 00f325ae-a274-4d09-b72e-c62b0aeb6903 -AppToken c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca
#>


<#
$File = 'input.csv'
$AppId = "00f325ae-a274-4d09-b72e-c62b0aeb6903"
$AppToken = "c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca"
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
    [string]$Reason,
    
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$AppId,
    
    [Parameter(Mandatory=$true)]
	[ValidateNotNullOrEmpty()]
    [string]$AppToken
)

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

function getCustomer($email) {    
    $uri = "$baseUri/customers?email=$email"
        
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders 
    $customers = ConvertFrom-Json $([String]::new($responsesRaw.Content))

    return $customers.customers[0].id
}

function getVouchers($customerId, $reason) {    
    $uri = "$baseUri/vouchers?customer=$customerId&limit=100&[filters][type][conditions][`$is]=GIFT_VOUCHER&[filters][metadata.reason][conditions][`$is][0]=$reason&[filters][active][conditions][`$active][0]=true&[filters][junction]=and&[order]=created_at"
        
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders 
    $voucherObject = ConvertFrom-Json $([String]::new($responsesRaw.Content))

    return $voucherObject.vouchers
}

function updateAmount($voucherId, $amount) {
    $uri = "$baseUri/vouchers/$voucherId/balance"
    $body = @"
{
	"amount": $amount
}
"@
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Post -Body $body
}

function reedemVoucher($voucherId, $amount, $source, $reason) {
    $uri = "$baseUri/vouchers/$voucherId/redemption"
    $body = @"
{
	"order": {
		"amount": $amount
    },
	"metadata": {        
        "reason": "$reason",
        "source": "$source"
    }
}
"@
    $responsesRaw = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Post -Body $body
	$redemption = ConvertFrom-Json $([String]::new($responsesRaw.Content))
	return $redemption.id;
}

function updateVoucherMetadata($voucherId, $voucherBalance) {
    $uri = "$baseUri/vouchers/$voucherId"
    $body = @"
{
	"metadata": {
		"credit_cancelled_by_bulk_tool": true,
        "amount_before_cancellation": $voucherBalance
	}
}
"@
    $resp = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Put -Body $body
}


#Columns: Email
$rowsInFile = import-csv $File

$i = 1
$totalRows = $rowsInFile.Count
if($totalRows -eq $null) {
    $totalRows = 1
}

$outputFileName = "redeem-promo-credits-output-$($(Get-Date).ToString('yyyyMMdd-HHmmss')).csv"
"User email,User ID,Voucher ID,Voucher balance,Redemption ID" | add-Content -Path $outputFileName

foreach($row in $rowsInFile) {
	
    Write-Host -NoNewline "Processing: $i of ($totalRows): $row  "
    
	try {
		
	    $originalEmail = $row.Email
		
		if(-not(IsValidEmail $originalEmail))
		{
			throw "Email: $originalEmail is invalid, will be skipped!"
		}
		
        # Get customer id
		$email = $originalEmail.ToLower()
        $customerId = getCustomer $email
	  
        if($customerId -eq $null) {
            throw "Cannot find customer with email $email!"
        }
		
		#Get customer`s gift vouchers with not zero balance
		$vouchers = getVouchers $customerId $Reason | Where-Object { $_.gift.balance -gt 0 }
		
		if($vouchers -eq $null)
		{
			throw "$originalEmail doesn't have any promo vouchers to reedem!"
		}
	
	    #Try to reedem each voucher
		foreach($voucher in $vouchers){
			
			#Write-Host ($voucher | Format-List -Force | Out-String)
			
			$voucherBalance = $voucher.gift.balance
			$voucherId = $voucher.id;
			
			#Try to reedem voucher`s balance
			$redemptionId = reedemVoucher $voucherId $voucherBalance $Source $Reason
			Write-Host "`nVouchersId: $voucherId with amount: $($voucherBalance/100) has been redeemed. Belonged to: $email. Redemption id: $redemptionId" -ForegroundColor green

            # Update voucher's metadata
            updateVoucherMetadata $voucherId $($voucherBalance/100)

            "$email,$customerId,$voucherId,$($voucherBalance/100),$redemptionId" | add-Content -Path $outputFileName
		}
		
    } catch {
        Write-Host "`nERROR: Cannot redeem promo vouchers from $($row.Email). Reason: $_" -ForegroundColor red
    }
	
    $i++       
}

Write-Output "`nDone. Output file: $outputFileName"