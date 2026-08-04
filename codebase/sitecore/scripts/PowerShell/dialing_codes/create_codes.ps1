$parent_item = Get-Item master: -ID "{636369E5-6D27-4CBC-883B-8F4CFDD8E903}"
$template_id = "{D333F42F-ADB6-402F-84C7-9015755BC38E}"

$path = "C:\projects\digital\sitecore\scripts\PowerShell\dialing_codes\dialing_codes.csv"

$countries = Import-Csv $path -delimiter ","
$countries | ForEach-Object {
    $Title = $_.area_name
    $Code = $_.dil_code
    
    $item = New-Item -Parent $parent_item -Name $Code -ItemType $template_id
    $item.Editing.BeginEdit()
    $item["Title"] = $Title
    $item["Code"] = $Code`
    
    Write-Host "item $_ created"
}