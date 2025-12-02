package com.zhe.app

import android.content.Intent
import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.webkit.WebView
import android.webkit.CookieManager
import android.view.KeyEvent
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  private var appWebView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    checkFilePermissions()
    val serviceIntent = Intent(this, HttpService::class.java)
    startForegroundService(serviceIntent)
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
}
