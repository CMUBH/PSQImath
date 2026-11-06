"use strict";

document.body.classList.toggle("drive-ready", Boolean(window.PsqiDriveConfig?.clientId));

const PsqiDrive = (() => {
  const scope = "https://www.googleapis.com/auth/drive";
  const configuration = () => window.PsqiDriveConfig || {};

  function authorize() {
    if (location.protocol === "file:")
      throw new Error("Google 上傳請從 https://cmubh.github.io/PSQImath/ 開啟；直接開啟本機 HTML 沒有可註冊的網站來源。");
    const clientId = String(configuration().clientId || "").trim();
    if (!clientId) throw new Error("尚未設定 Google OAuth 用戶端 ID；請先完成 README 的 Google 雲端設定。");
    if (!window.google?.accounts?.oauth2) throw new Error("無法載入 Google 登入服務，請檢查網路連線後重試。");
    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: response => response.error
          ? reject(new Error(response.error_description || response.error))
          : response.access_token
            ? resolve(response.access_token)
            : reject(new Error("Google 未提供上傳所需的授權。")),
        error_callback: error => reject(new Error(error.type === "popup_closed"
          ? "已取消 Google 登入。"
          : "無法開啟 Google 登入視窗；請允許彈出視窗後重試。"))
      });
      client.requestAccessToken();
    });
  }

  async function uploadFile({blob, name}, token) {
    if (!(blob instanceof Blob) || !name) throw new Error("待上傳的檔案無效。");
    const folderId = String(configuration().folderId || "").trim();
    if (!folderId) throw new Error("尚未設定 Google 雲端資料夾 ID。");
    const boundary = `psqi_${crypto.randomUUID().replaceAll("-", "")}`;
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify({name, parents: [folderId]}),
      `\r\n--${boundary}\r\nContent-Type: ${blob.type || "application/octet-stream"}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--\r\n`
    ]);
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink", {
      method: "POST",
      headers: {Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}`},
      body
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 403 || response.status === 404)
        throw new Error("無法寫入指定資料夾；請確認登入帳號具有編輯權限。Google 回應：" + (error.error?.message || response.status));
      throw new Error("上傳失敗：" + (error.error?.message || `HTTP ${response.status}`));
    }
    return response.json();
  }

  async function uploadFiles(filesOrFactory, onProgress = () => {}) {
    // Start the OAuth popup while still handling the user's click.
    const token = await authorize();
    const files = typeof filesOrFactory === "function" ? await filesOrFactory() : filesOrFactory;
    if (!Array.isArray(files) || !files.length) throw new Error("目前沒有可上傳的檔案。");
    const results = [];
    for (const [index, file] of files.entries()) {
      onProgress(index + 1, files.length, file.name);
      results.push(await uploadFile(file, token));
    }
    return results;
  }

  return {uploadFiles};
})();
