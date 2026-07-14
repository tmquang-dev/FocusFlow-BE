import js from "@eslint/js";
import globals from "globals";
import nodePlugin from "eslint-plugin-n";
import securityPlugin from "eslint-plugin-security";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    // ==========================================
    // 1. ĐỘ PHỦ TỆP TIN: Bỏ qua các file không cần linter quét qua
    // ==========================================
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/coverage/**",
            "**/logs/**",
            "eslint.config.js"
        ]
    },

    // ==========================================
    // 2. ĐỘ PHỦ LỖI CÚ PHÁP: Áp dụng luật khuyến khuyến nghị của JavaScript
    // ==========================================
    js.configs.recommended,

    // ==========================================
    // 3. ĐỘ PHỦ ĐẶC THÙ NODE.JS: Kiểm soát cơ chế module, import/export và API Node.js
    // ==========================================
    nodePlugin.configs["flat/recommended"],

    // ==========================================
    // 4. ĐỘ PHỦ BẢO MẬT: Phát hiện các lỗ hổng bảo mật backend
    // ==========================================
    securityPlugin.configs.recommended,

    // ==========================================
    // 5. CẤU HÌNH CHI TIẾT CHO CÁC TỆP TIN EXPRESS
    // ==========================================
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,     // Nhận diện biến môi trường Node.js (process, console, __dirname...)
                ...globals.es2021,   // Nhận diện các tính năng ES hiện đại
            }
        },
        rules: {
            // 5.1. Quy tắc ghi Log (tránh tràn ngập log rác trong môi trường Production)
            "no-console": ["warn", { allow: ["warn", "error"] }], // Cho phép console.warn và console.error, hạn chế console.log dư thừa

            // 5.2. Quy tắc cho Express Middleware (Xử lý các tham số không dùng đến)
            // Thông thường Express middleware yêu cầu đủ 4 tham số (err, req, res, next).
            // Luật này cho phép khai báo tham số nhưng không dùng nếu bắt đầu bằng dấu gạch dưới (ví dụ: _next)
            "no-unused-vars": ["error", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],

            // 5.3. Tránh việc gọi process.exit() trực tiếp làm sập máy chủ Express
            "no-process-exit": "error",

            // 5.4. Bắt buộc xử lý lỗi trong các hàm Callback
            "handle-callback-err": ["error", "^(err|error)$"],

            // 5.5. Cân chỉnh bảo mật (Tùy biến từ eslint-plugin-security)
            // "security/detect-object-injection" thường báo lỗi giả (false positive) khá nhiều 
            // khi bạn truy cập object bằng key dạng chuỗi. Bạn có thể hạ cấp xuống "warn" hoặc "off"
            "security/detect-object-injection": "warn",
        }
    },

    // ==========================================
    // 6. TRÁNH XUNG ĐỘT ĐỊNH DẠNG: Override các rule xung đột với Prettier (Nếu có dùng)
    // ==========================================
    eslintConfigPrettier
];