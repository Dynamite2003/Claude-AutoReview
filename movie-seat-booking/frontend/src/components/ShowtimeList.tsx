import React, { useEffect, useState } from 'react';
import { Showtime, Movie } from '../types';
import { apiService } from '../services/api';

interface ShowtimeListProps {
  movie: Movie;
  onShowtimeSelect: (showtime: Showtime) => void;
  onBack: () => void;
}

export const ShowtimeList: React.FC<ShowtimeListProps> = ({ 
  movie, 
  onShowtimeSelect, 
  onBack 
}) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadShowtimes();
  }, [movie.id, selectedDate]);

  const loadShowtimes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMovieShowtimes(movie.id, selectedDate);
      setShowtimes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载场次失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成接下来7天的日期选项
  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? '今天' : i === 1 ? '明天' : 
               `${date.getMonth() + 1}月${date.getDate()}日`,
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
      });
    }
    return dates;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const groupShowtimesByCinema = () => {
    const grouped: { [key: string]: Showtime[] } = {};
    showtimes.forEach(showtime => {
      if (!grouped[showtime.cinema_name]) {
        grouped[showtime.cinema_name] = [];
      }
      grouped[showtime.cinema_name].push(showtime);
    });
    return grouped;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 电影信息头部 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回电影列表
          </button>
        </div>
        
        <div className="flex gap-6">
          <img
            src={movie.poster_url || '/placeholder-movie.jpg'}
            alt={movie.title}
            className="w-32 h-48 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{movie.title}</h1>
            <div className="space-y-2 text-gray-600">
              <p><span className="font-semibold">类型:</span> {movie.genre}</p>
              <p><span className="font-semibold">时长:</span> {movie.duration}分钟</p>
              <p><span className="font-semibold">评级:</span> {movie.rating}</p>
              <p><span className="font-semibold">导演:</span> {movie.director}</p>
              <p><span className="font-semibold">主演:</span> {movie.cast}</p>
            </div>
            <p className="mt-4 text-gray-700">{movie.description}</p>
          </div>
        </div>
      </div>

      {/* 日期选择 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">选择日期</h2>
        <div className="flex gap-2 overflow-x-auto">
          {getDateOptions().map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg text-center min-w-24 ${
                selectedDate === date.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-sm font-semibold">{date.label}</div>
              <div className="text-xs">{date.weekday}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 场次列表 */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={loadShowtimes} className="btn-primary">
              重新加载
            </button>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            该日期暂无场次安排
          </div>
        ) : (
          Object.entries(groupShowtimesByCinema()).map(([cinemaName, cinemaShowtimes]) => (
            <div key={cinemaName} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{cinemaName}</h3>
              <div className="space-y-4">
                {Object.entries(
                  cinemaShowtimes.reduce((acc: { [key: string]: Showtime[] }, showtime) => {
                    if (!acc[showtime.theater_name]) {
                      acc[showtime.theater_name] = [];
                    }
                    acc[showtime.theater_name].push(showtime);
                    return acc;
                  }, {})
                ).map(([theaterName, theaterShowtimes]) => (
                  <div key={theaterName}>
                    <h4 className="font-medium text-gray-700 mb-2">{theaterName}</h4>
                    <div className="flex flex-wrap gap-3">
                      {theaterShowtimes.map((showtime) => (
                        <button
                          key={showtime.id}
                          onClick={() => onShowtimeSelect(showtime)}
                          className="bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-lg px-4 py-3 text-center transition-colors"
                        >
                          <div className="font-semibold text-gray-900">
                            {formatTime(showtime.show_date)}
                          </div>
                          <div className="text-sm text-primary-600">
                            ¥{showtime.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};