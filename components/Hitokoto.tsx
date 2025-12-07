"use client";

import { useState, useEffect } from "react";
import { Quote } from "lucide-react";

interface HitokotoData {
  hitokoto: string;
  from: string;
  from_who?: string;
}

export default function Hitokoto() {
  const [quote, setQuote] = useState<HitokotoData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHitokoto = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k&c=l");
      const data = await response.json();
      setQuote({
        hitokoto: data.hitokoto,
        from: data.from,
        from_who: data.from_who,
      });
    } catch (error) {
      console.error("Failed to fetch hitokoto:", error);
      setQuote({
        hitokoto: "生活不是等待暴风雨过去，而是要学会在雨中跳舞。",
        from: "未知",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHitokoto();
    // 每30秒刷新一次
    const interval = setInterval(fetchHitokoto, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card glass-card-hover p-6 h-full flex flex-col justify-between group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/20 to-aurora-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Quote className="w-5 h-5 text-aurora-purple" />
          <h3 className="text-lg font-semibold text-white">一言</h3>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
          </div>
        ) : quote ? (
          <>
            <p className="text-white/80 leading-relaxed mb-4 min-h-[60px]">
              {quote.hitokoto}
            </p>
            <div className="text-white/40 text-sm text-right">
              {quote.from_who ? `${quote.from_who} - ` : ""}
              {quote.from}
            </div>
          </>
        ) : null}
      </div>
      
      <button
        onClick={fetchHitokoto}
        className="mt-4 text-xs text-white/40 hover:text-white/60 transition-colors relative z-10"
      >
        点击刷新
      </button>
    </div>
  );
}

