# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep FileProvider for file sharing
-keep class androidx.core.content.FileProvider { *; }
-keep class androidx.core.content.** { *; }

# Keep AndroidX classes used via JNI
-keep class androidx.** { *; }
-dontwarn androidx.**

# Keep Android Intent and Uri classes
-keep class android.content.Intent { *; }
-keep class android.net.Uri { *; }

# Keep JNI methods
-keepclasseswithmembernames class * {
    native <methods>;
}