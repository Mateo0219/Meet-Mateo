"use client";

import { useEffect, useState } from "react";

export default function TextApp() {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/llms.txt", { signal: controller.signal })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then(setText)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("读取 llms.txt 失败:", error);
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="text-app">
      <p className="text-app-note">给 AI 代理读的简版。ChatGPT、Claude 这类工具访问这个网站时，会优先看这份文件。</p>
      <pre>{failed ? "暂时读不到 llms.txt。" : text ?? "正在读取…"}</pre>
    </div>
  );
}
