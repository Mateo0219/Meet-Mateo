"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function DateTime() {
  const [dateTime, setDateTime] = useState({
    date: "",
    time: "",
    weekDay: "",
  });

  const updateDateTime = () => {
    const now = new Date();
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    
    setDateTime({
      date: now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      weekDay: weekDays[now.getDay()],
    });
  };

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="glass-card-hover p-6 group relative overflow-hidden w-full h-[200px] rounded-2xl border border-white/5"
      style={{
        background: 'rgba(10, 10, 10, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-blue/10 to-aurora-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-aurora-blue" />
          <h3 className="text-lg font-semibold text-white">时间</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-between">
          {/* 左侧：时间 - 超大显示，充满左边 */}
          <div className="flex-1 flex flex-col justify-center items-center h-full">
            <div className="text-6xl md:text-7xl font-bold text-white/90 font-mono leading-none">
              {dateTime.time}
            </div>
          </div>

          {/* 右侧：日期和星期 - 上下排列，充满右边 */}
          <div className="flex-1 flex flex-col justify-center items-end h-full">
            {/* 日期 */}
            <div className="text-xl font-medium text-white/80 mb-4">
              {dateTime.date}
            </div>
            
            {/* 星期 */}
            <div className="text-xl font-medium text-white/80">
              {dateTime.weekDay}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
