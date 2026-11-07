document.getElementById("btnRun").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: startAutoFillFinal,
  });
});

async function startAutoFillFinal() {
  const CONFIG = {
    USER: "duonggia2",
    PASS: "090906Ab@",
    // ĐẢM BẢO KEY KHÔNG CÓ KHOẢNG TRẮNG Ở HAI ĐẦU
    API_KEY: "AIzaSyCE9OTD2xX1xKws4G094dyINA1KWBba0NQ",
  };

  const inputUser = document.getElementById("txtUser");
  const inputPass = document.getElementById("txtPass");
  const inputCaptcha = document.getElementById("txtCaptcha");
  const btnLogin = document.getElementById("btnLogin1");
  const imgCaptcha = document.querySelector("#UpdatePanel1 img");

  if (!inputUser || !imgCaptcha) return;

  inputUser.value = CONFIG.USER;
  inputPass.value = CONFIG.PASS;

  try {
    console.log("Đang xử lý ảnh CAPTCHA qua Canvas...");

    const canvas = document.createElement("canvas");
    canvas.width = imgCaptcha.naturalWidth;
    canvas.height = imgCaptcha.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgCaptcha, 0, 0);

    // Lấy Base64 sạch
    const base64Image = canvas
      .toDataURL("image/png")
      .replace(/^data:image\/(png|jpg);base64,/, "");

    const specializedPrompt = `Bạn là một AI chuyên phân tích hình ảnh mã captcha. Tôi sẽ cung cấp cho bạn một hình ảnh captcha chứa một mã gồm đúng 4 ký tự. Trích xuất chính xác nội dung mã (0-9, A-Z). Không chữ thường. Chỉ trả về duy nhất chuỗi 4 ký tự, không giải thích.`;

    console.log("Đang gửi yêu cầu đến Gemini API...");

    // FIX LỖI 404: Đảm bảo URL chính xác tuyệt đối
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      CONFIG.API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: specializedPrompt },
              { inline_data: { mime_type: "image/png", data: base64Image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API trả về lỗi ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const code = data.candidates[0].content.parts[0].text
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const finalCode = code.substring(0, 4);

      console.log("Giải mã thành công: " + finalCode);
      inputCaptcha.value = finalCode;

      // Nhấn nút đăng nhập
      setTimeout(() => {
        console.log("Đang đăng nhập...");
        btnLogin.click();
      }, 500);
    }
  } catch (e) {
    console.error("LỖI CHI TIẾT:", e.message);
    alert("Lỗi: " + e.message);
  }
}
