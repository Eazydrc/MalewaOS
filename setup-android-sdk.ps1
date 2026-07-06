# Script d'installation SDK Android + build APK
$sdkDir    = "$env:LOCALAPPDATA\Android\Sdk"
$zipFile   = "$env:USERPROFILE\android-cmdtools.zip"
$toolsDir  = "$sdkDir\cmdline-tools\latest"

# 1. Décompresser les command line tools
Write-Host "Décompression des command line tools..."
New-Item -ItemType Directory -Force "$sdkDir\cmdline-tools" | Out-Null
Expand-Archive -Path $zipFile -DestinationPath "$sdkDir\cmdline-tools\tmp" -Force
if (Test-Path "$sdkDir\cmdline-tools\tmp\cmdline-tools") {
  Move-Item "$sdkDir\cmdline-tools\tmp\cmdline-tools" $toolsDir -Force
} else {
  Move-Item "$sdkDir\cmdline-tools\tmp" $toolsDir -Force
}
Write-Host "SDK tools extraits dans $toolsDir"

# 2. Configurer les variables d'environnement
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:PATH = "$toolsDir\bin;$sdkDir\platform-tools;$env:PATH"
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkDir, "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkDir, "User")

# 3. Accepter les licences et installer les composants nécessaires
Write-Host "Installation des composants SDK (build-tools, platform-tools, android-36)..."
$sdkmanager = "$toolsDir\bin\sdkmanager.bat"
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"

echo "y" | & $sdkmanager --sdk_root=$sdkDir "platform-tools" "platforms;android-36" "build-tools;36.0.0"

Write-Host "SDK Android installé."

# 4. Build APK debug
Write-Host "Build de l'APK..."
$gradlew = "D:\Taff\Claude\Nouveau dossier\MalewaOS\app\android\gradlew.bat"
& $gradlew -p "D:\Taff\Claude\Nouveau dossier\MalewaOS\app\android" assembleDebug

$apk = "D:\Taff\Claude\Nouveau dossier\MalewaOS\app\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
  Write-Host "✅ APK généré : $apk"
  Copy-Item $apk "D:\Taff\Claude\Nouveau dossier\MalewaOS\Elengi-debug.apk"
  Write-Host "✅ Copié dans : D:\Taff\Claude\Nouveau dossier\MalewaOS\Elengi-debug.apk"
} else {
  Write-Host "❌ APK non trouvé — vérifie les erreurs Gradle ci-dessus"
}
