(function () {
  var PLAY_STORE_BASE = "https://play.google.com/store/apps/details?id=com.digigene.mobilebodyquiz.mobile_body_quiz";
  var APP_STORE_BASE = "https://apps.apple.com/sr/app/anatomy-quiz-trivia-body-game/id6605926572";
  var APP_STORE_NATIVE_URL = "itms-apps://itunes.apple.com/app/id6605926572";
  var REDIRECT_DELAY = 500;
  var DEVICE_UID_KEY = "aq_device_uid";
  var INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4,16}$/;

  var DEFAULT_API_BASE_URL = "https://r2fihr72e5.execute-api.ap-southeast-2.amazonaws.com/prod";
  var config = window.AQ_CONFIG || {};
  var apiBaseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;

  function parseInviteCode() {
    var params = new URLSearchParams(window.location.search);
    var queryCode = params.get("inviteCode");
    if (queryCode) {
      queryCode = queryCode.trim().toUpperCase();
      if (INVITE_CODE_PATTERN.test(queryCode)) {
        return queryCode;
      }
    }

    var parts = window.location.pathname.split("/").filter(Boolean);
    var challengeIndex = parts.indexOf("challenge");
    if (challengeIndex !== -1 && challengeIndex + 1 < parts.length) {
      var pathCode = parts[challengeIndex + 1].trim().toUpperCase();
      if (INVITE_CODE_PATTERN.test(pathCode)) {
        return pathCode;
      }
    }

    return null;
  }

  function getOrCreateDeviceUid() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = params.get("deviceUid");
      if (fromUrl) {
        localStorage.setItem(DEVICE_UID_KEY, fromUrl);
        return fromUrl;
      }

      var existing = localStorage.getItem(DEVICE_UID_KEY);
      if (existing) {
        return existing;
      }
      var created = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : "aq-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      localStorage.setItem(DEVICE_UID_KEY, created);
      return created;
    } catch (error) {
      return "aq-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }
  }

  function appendDeviceUidToUrl(deviceUid) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("deviceUid", deviceUid);
      window.history.replaceState({}, "", url.toString());
      return url.toString();
    } catch (error) {
      return window.location.href;
    }
  }

  function recordDeferredInvite(inviteCode, deviceUid) {
    return fetch(apiBaseUrl + "/recordDeferredInvite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceUid: deviceUid,
        inviteCode: inviteCode,
      }),
    }).then(function (response) {
      if (!response.ok) {
        console.warn("recordDeferredInvite failed with status", response.status);
      }
    }).catch(function (error) {
      console.warn("recordDeferredInvite request failed", error);
    });
  }

  function buildStoreUrls(source, medium, deviceUid) {
    var playStoreUrl = PLAY_STORE_BASE;
    var appStoreUrl = APP_STORE_BASE;
    var referrerParts = [];
    if (source && medium) {
      referrerParts.push("utm_source=" + source);
      referrerParts.push("utm_medium=" + medium);
    }
    if (deviceUid) {
      referrerParts.push("deviceUid=" + deviceUid);
    }
    if (referrerParts.length > 0) {
      playStoreUrl += "&referrer=" + encodeURIComponent(referrerParts.join("&"));
    }
    if (source && medium) {
      appStoreUrl += "&ct=" + encodeURIComponent(source + "_" + medium);
    }
    return { playStoreUrl: playStoreUrl, appStoreUrl: appStoreUrl };
  }

  function startRedirect(playStoreUrl, appStoreUrl, noticeText) {
    document.getElementById("btn-play").href = playStoreUrl;
    document.getElementById("btn-apple").href = appStoreUrl;

    var ua = navigator.userAgent || "";
    var isAndroid = /android/i.test(ua);
    var isIOS = /iphone|ipad|ipod/i.test(ua);
    var notice = document.getElementById("redirect-notice");

    if (noticeText) {
      notice.textContent = noticeText;
    }

    if (isAndroid) {
      if (!noticeText) {
        notice.textContent = "Redirecting you to Google Play…";
      }
      setTimeout(function () { window.location.href = playStoreUrl; }, REDIRECT_DELAY);
    } else if (isIOS) {
      if (!noticeText) {
        notice.textContent = "Redirecting you to the App Store…";
      }
      setTimeout(function () { window.location.href = APP_STORE_NATIVE_URL; }, REDIRECT_DELAY);
    }
  }

  var params = new URLSearchParams(window.location.search);
  var source = params.get("source") || "";
  var medium = params.get("medium") || "";
  var inviteCode = parseInviteCode();

  if (inviteCode) {
    var deviceUid = getOrCreateDeviceUid();
    appendDeviceUidToUrl(deviceUid);
    var storeUrls = buildStoreUrls(source, medium, deviceUid);

    var challengeTitle = document.getElementById("challenge-title");
    var challengeTagline = document.getElementById("challenge-tagline");
    if (challengeTitle) {
      challengeTitle.textContent = "You've been challenged!";
    }
    if (challengeTagline) {
      challengeTagline.textContent = "Download Anatomy Quiz, sign in, and accept your friend's challenge.";
    }

    recordDeferredInvite(inviteCode, deviceUid).finally(function () {
      startRedirect(
        storeUrls.playStoreUrl,
        storeUrls.appStoreUrl,
        "Saving your invite and redirecting you to download the app…"
      );
    });
    return;
  }

  var storeUrls = buildStoreUrls(source, medium, null);
  startRedirect(storeUrls.playStoreUrl, storeUrls.appStoreUrl, "");
})();
