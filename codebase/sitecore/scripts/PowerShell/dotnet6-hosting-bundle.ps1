# Define the URL for the .NET 6 Hosting Bundle installer
$dotnetHostingBundleUrl = "https://download.visualstudio.microsoft.com/download/pr/fee6ce1d-a3c4-4aed-ba11-5cbb9e22e5b1/8b1248f13ca5326850112ad45ccf3527/dotnet-hosting-6.0.31-win.exe" # Update this URL with the correct one from the .NET website

# Define the local path to save the installer
$installerPath = "C:\dotnet-hosting-6.0.31-win.exe"

# Download the installer
Invoke-WebRequest -Uri $dotnetHostingBundleUrl -OutFile $installerPath

# Install the Hosting Bundle
Start-Process -FilePath $installerPath -ArgumentList "/quiet" -Wait

# Clean up: Remove the installer
Remove-Item $installerPath
