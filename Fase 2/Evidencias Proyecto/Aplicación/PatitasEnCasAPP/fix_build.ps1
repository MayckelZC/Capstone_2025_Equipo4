# This script builds the web application and synchronizes the assets with the Android project.
# Running this script should fix the "white screen" issue.

# Step 1: Build the Angular web application
Write-Host "Building the web application... (npm run build)"
npm run build

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: The web application build failed."
    exit 1
}

# Step 2: Synchronize the web assets with the Android project
Write-Host "Synchronizing web assets with the Android project... (npx cap sync android)"
npx cap sync android

# Check if the sync was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: The synchronization with the Android project failed."
    exit 1
}

Write-Host "Build and sync process completed successfully."
Write-Host "You can now open your project in Android Studio and run it on your device."
