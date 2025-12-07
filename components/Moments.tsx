"use client";

import { Calendar, MapPin, Heart, MessageCircle, Share2, Image as ImageIcon } from "lucide-react";

// 朋友圈动态数据
interface Moment {
  id: string;
  date: string;
  time: string;
  location?: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  gradient: string;
}

const moments: Moment[] = [
  {
    id: "1",
    date: "2024-01-20",
    time: "14:30",
    location: "足球场",
    content: "今天和队友们踢了一场精彩的比赛，虽然很累但是很开心！团队配合越来越默契了。",
    images: ["/moment1.jpg"],
    likes: 24,
    comments: 8,
    gradient: "from-aurora-purple/20 to-aurora-blue/20",
  },
  {
    id: "2",
    date: "2024-01-18",
    time: "19:00",
    location: "乒乓球馆",
    content: "练习了两个小时的乒乓球，感觉技术又进步了一点。坚持就是胜利！",
    images: ["/moment2.jpg"],
    likes: 18,
    comments: 5,
    gradient: "from-aurora-cyan/20 to-aurora-pink/20",
  },
  {
    id: "3",
    date: "2024-01-15",
    time: "12:00",
    content: "周末和朋友一起聚餐，聊了很多有趣的话题。友谊是最珍贵的财富。",
    images: ["/moment3.jpg", "/moment4.jpg"],
    likes: 32,
    comments: 12,
    gradient: "from-aurora-blue/20 to-aurora-purple/20",
  },
  {
    id: "4",
    date: "2024-01-12",
    time: "16:20",
    location: "公园",
    content: "今天天气真好，出来走走，呼吸新鲜空气。生活中的小确幸就是这么简单。",
    images: ["/moment5.jpg"],
    likes: 15,
    comments: 3,
    gradient: "from-aurora-pink/20 to-aurora-cyan/20",
  },
  {
    id: "5",
    date: "2024-01-10",
    time: "20:15",
    content: "看了一部很棒的电影，思考了很多。艺术总是能给人带来启发。",
    likes: 28,
    comments: 9,
    gradient: "from-aurora-purple/20 to-aurora-pink/20",
  },
];

interface MomentCardProps {
  moment: Moment;
}

function MomentCard({ moment }: MomentCardProps) {
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  };

  return (
    <div className="glass-card glass-card-hover overflow-hidden group relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${moment.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aurora-purple to-aurora-cyan flex items-center justify-center text-white font-bold text-lg">
              我
            </div>
            <div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(moment.date)} {moment.time}</span>
              </div>
              {moment.location && (
                <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{moment.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-white/80 leading-relaxed mb-4">{moment.content}</p>

        {/* Images */}
        {moment.images && moment.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            moment.images.length === 1 ? "grid-cols-1" :
            moment.images.length === 2 ? "grid-cols-2" :
            moment.images.length === 3 ? "grid-cols-3" :
            "grid-cols-2"
          }`}>
            {moment.images.map((image, index) => (
              <div
                key={index}
                className="aspect-square bg-gradient-to-br from-aurora-purple/20 to-aurora-cyan/20 rounded-lg flex items-center justify-center relative overflow-hidden group/image"
              >
                <ImageIcon className="w-8 h-8 text-white/20 group-hover/image:text-white/40 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/30 to-aurora-cyan/30 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-white/10">
          <button className="flex items-center gap-2 text-white/60 hover:text-aurora-pink transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{moment.likes}</span>
          </button>
          <button className="flex items-center gap-2 text-white/60 hover:text-aurora-blue transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{moment.comments}</span>
          </button>
          <button className="flex items-center gap-2 text-white/60 hover:text-aurora-cyan transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Moments() {
  return (
    <section id="moments" className="py-20 md:py-32 relative">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            朋友圈
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            记录和分享生活中的点点滴滴
          </p>
        </div>

        {/* Moments Feed */}
        <div className="space-y-6">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="glass-card glass-card-hover px-8 py-4 rounded-xl font-medium text-white">
            加载更多动态
          </button>
        </div>
      </div>
    </section>
  );
}

