package com.zhe.app

import android.content.Intent
import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.webkit.WebView
import android.webkit.CookieManager
import android.view.KeyEvent
import android.net.Uri
import android.provider.OpenableColumns
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.activity.enableEdgeToEdge
import java.io.File
import java.io.FileOutputStream

class MainActivity : TauriActivity() {
  private var appWebView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    checkFilePermissions()
    val serviceIntent = Intent(this, HttpService::class.java)
    startForegroundService(serviceIntent)
    
    // Handle shared files on app launch
    handleSharedFiles(intent)
  }
  
  @Deprecated("Deprecated in Java")
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Handle shared files when app is already running
    handleSharedFiles(intent)
  }

  override fun onDestroy() {
    super.onDestroy()
    // Don't stop service on destroy, let it run in background
  }

  override fun onWebViewCreate(webView: WebView) {
    this.appWebView = webView
    super.onWebViewCreate(webView)
    
    webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
      val safeUrl = url.replace("'", "\\'")
      val safeDisposition = if (contentDisposition != null) contentDisposition.replace("'", "\\'") else ""
      val safeMime = if (mimetype != null) mimetype.replace("'", "\\'") else ""
      val cookies = CookieManager.getInstance().getCookie(url)
      val safeCookies = if (cookies != null) cookies.replace("'", "\\'") else ""
      
      val js = "if(window.handleDownloadRequest) window.handleDownloadRequest('$safeUrl', '$safeDisposition', '$safeMime', $contentLength, '$safeCookies')"
      webView.post {
        webView.evaluateJavascript(js, null)
      }
    }
  }

  override fun onBackPressed() {
    appWebView?.let { webView ->
      var handled = false
      val js = "if(window.handleAndroidBack) { window.handleAndroidBack(); 'handled'; } else { 'default'; }"
      
      webView.evaluateJavascript(js) { result ->
        if (!handled) {
          handled = true
          if (result == null || result == "null" || result == "\"default\"") {
            moveTaskToBack(true)
          }
        }
      }
      
      webView.postDelayed({
        if (!handled) {
          handled = true
          moveTaskToBack(true)
        }
      }, 100)
    } ?: moveTaskToBack(true)
  }

  private fun checkFilePermissions() {
    val permissions = arrayOf(
      Manifest.permission.READ_EXTERNAL_STORAGE,
      Manifest.permission.WRITE_EXTERNAL_STORAGE
    )

    val permissionsToRequest = permissions.filter {
      ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }.toTypedArray()

    if (permissionsToRequest.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, permissionsToRequest, 100)
    }
  }
  
  private fun handleSharedFiles(intent: Intent?) {
    if (intent == null) return
    
    when (intent.action) {
      Intent.ACTION_SEND -> {
        intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)?.let { uri ->
          handleSingleFile(uri)
        }
      }
      Intent.ACTION_SEND_MULTIPLE -> {
        intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.let { uris ->
          handleMultipleFiles(uris)
        }
      }
    }
  }
  
  private fun handleSingleFile(uri: Uri) {
    try {
      val fileInfo = getFileInfo(uri)
      val filePath = copyFileToCache(uri, fileInfo.name)
      
      appWebView?.post {
        val js = """
          if (window.handleSharedFile) {
            window.handleSharedFile('$filePath', '${fileInfo.name}', ${fileInfo.size}, '${fileInfo.type}');
          }
        """.trimIndent()
        appWebView?.evaluateJavascript(js, null)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
  
  private fun handleMultipleFiles(uris: List<Uri>) {
    try {
      val filesJson = uris.mapNotNull { uri ->
        try {
          val fileInfo = getFileInfo(uri)
          val filePath = copyFileToCache(uri, fileInfo.name)
          """{"path":"$filePath","name":"${fileInfo.name}","size":${fileInfo.size},"type":"${fileInfo.type}"}"""
        } catch (e: Exception) {
          null
        }
      }.joinToString(",")
      
      appWebView?.post {
        val js = """
          if (window.handleSharedFiles) {
            window.handleSharedFiles([$filesJson]);
          }
        """.trimIndent()
        appWebView?.evaluateJavascript(js, null)
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
  
  private fun getFileInfo(uri: Uri): FileInfo {
    var name = "unknown"
    var size = 0L
    var type = contentResolver.getType(uri) ?: "application/octet-stream"
    
    contentResolver.query(uri, null, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
        if (nameIndex != -1) name = cursor.getString(nameIndex)
        if (sizeIndex != -1) size = cursor.getLong(sizeIndex)
      }
    }
    
    return FileInfo(name, size, type)
  }
  
  private fun copyFileToCache(uri: Uri, fileName: String): String {
    val cacheDir = File(cacheDir, "shared_files")
    if (!cacheDir.exists()) cacheDir.mkdirs()
    
    // Clean old files
    cacheDir.listFiles()?.forEach { it.delete() }
    
    val destFile = File(cacheDir, fileName)
    contentResolver.openInputStream(uri)?.use { input ->
      FileOutputStream(destFile).use { output ->
        input.copyTo(output)
      }
    }
    
    return destFile.absolutePath
  }
  
  data class FileInfo(val name: String, val size: Long, val type: String)
}
