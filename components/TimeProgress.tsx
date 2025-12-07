"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Cake } from "lucide-react";

export default function TimeProgress() {
  const [progress, setProgress] = useState({
    year: 0,
    yearPercent: 0,
    birthdayPercent: 0,
    daysUntilBirthday: 0,
    daysSinceBirthday: 0,
  });

  const updateProgress = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearTotal = yearEnd.getTime() - yearStart.getTime();
    const yearPassed = now.getTime() - yearStart.getTime();
    const yearPercent = (yearPassed / yearTotal) * 100;

    // 计算生日进度（1月9日）
    const currentYear = now.getFullYear();
    const birthdayThisYear = new Date(currentYear, 0, 9); // 1月9日（月份从0开始）
    const birthdayNextYear = new Date(currentYear + 1, 0, 9);
    
    let daysSinceBirthday = 0;
    let daysUntilBirthday = 0;
    let birthdayPercent = 0;

    if (now >= birthdayThisYear) {
      // 今年生日已过
      const nextBirthday = birthdayNextYear;
      const totalDays = nextBirthday.getTime() - birthdayThisYear.getTime();
      const passedDays = now.getTime() - birthdayThisYear.getTime();
      daysSinceBirthday = Math.floor(passedDays / (24 * 60 * 60 * 1000));
      daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      birthdayPercent = (passedDays / totalDays) * 100;
    } else {
      // 今年生日还没过
      const lastBirthday = new Date(currentYear - 1, 0, 9);
      const totalDays = birthdayThisYear.getTime() - lastBirthday.getTime();
      const passedDays = now.getTime() - lastBirthday.getTime();
      daysSinceBirthday = Math.floor(passedDays / (24 * 60 * 60 * 1000));
      daysUntilBirthday = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      birthdayPercent = (passedDays / totalDays) * 100;
    }

    setProgress({
      year: now.getFullYear(),
      yearPercent: Math.round(yearPercent * 100) / 100,
      birthdayPercent: Math.round(birthdayPercent * 100) / 100,
      daysUntilBirthday,
      daysSinceBirthday,
    });
  };

  useEffect(() => {
    updateProgress();
    const interval = setInterval(updateProgress, 1000);
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
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-cyan/10 to-aurora-pink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-aurora-cyan" />
          <h3 className="text-lg font-semibold text-white">时光进度</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-4">
          {/* 年度进度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">📅 {progress.year} 年</span>
              <span className="text-white/80 text-sm font-medium">{progress.yearPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aurora-purple to-aurora-cyan transition-all duration-1000"
                style={{ width: `${progress.yearPercent}%` }}
              />
            </div>
          </div>

          {/* 生日进度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-aurora-pink" />
                <span className="text-white/80 text-sm font-medium">生日进度</span>
              </div>
              <span className="text-white/80 text-sm font-medium">{progress.birthdayPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aurora-blue to-aurora-pink transition-all duration-1000"
                style={{ width: `${progress.birthdayPercent}%` }}
              />
            </div>
            <div className="text-white/60 text-sm mt-1.5">
              {progress.daysUntilBirthday > 0 
                ? `距离下次生日还有 ${progress.daysUntilBirthday} 天`
                : `距离下次生日还有 ${progress.daysUntilBirthday} 天`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
