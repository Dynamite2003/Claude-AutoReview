import React, { useEffect, useState, useCallback } from 'react';
import { Seat, SeatMap as SeatMapType } from '../types';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface SeatMapProps {
  showtimeId: number;
  onSeatSelection: (selectedSeats: Seat[]) => void;
  userId?: number;
}

interface SeatComponentProps {
  seat: Seat | null;
  isSelected: boolean;
  onSeatClick: (seat: Seat) => void;
}

const SeatComponent: React.FC<SeatComponentProps> = ({ seat, isSelected, onSeatClick }) => {
  if (!seat) {
    return <div className="w-8 h-8 m-1"></div>;
  }

  const getSeatClassName = () => {
    const baseClasses = 'seat m-1 text-xs font-bold';
    
    if (isSelected) {
      return `${baseClasses} seat-selected`;
    }

    switch (seat.status) {
      case 'available':
        return `${baseClasses} seat-available`;
      case 'occupied':
        return `${baseClasses} seat-occupied`;
      case 'reserved':
      case 'selected':
        return `${baseClasses} seat-occupied`;
      default:
        return `${baseClasses} seat-disabled`;
    }
  };

  const isClickable = seat.status === 'available' || isSelected;

  return (
    <div
      className={getSeatClassName()}
      onClick={() => isClickable && onSeatClick(seat)}
      title={`${seat.row_number}排${seat.seat_number}号 - ${seat.seat_type} - ${seat.status}`}
    >
      {seat.seat_number}
    </div>
  );
};

export const SeatMap: React.FC<SeatMapProps> = ({ showtimeId, onSeatSelection, userId = 1 }) => {
  const [seatMap, setSeatMap] = useState<SeatMapType | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 加载座位图
  const loadSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getSeatMap(showtimeId);
      setSeatMap(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载座位图失败');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  // WebSocket消息处理
  useEffect(() => {
    const handleSeatUpdate = (data: any) => {
      if (seatMap) {
        const updatedSeatMap = { ...seatMap };
        const seatId = data.seat_id;
        
        for (let rowIndex = 0; rowIndex < updatedSeatMap.seats.length; rowIndex++) {
          for (let seatIndex = 0; seatIndex < updatedSeatMap.seats[rowIndex].length; seatIndex++) {
            const seat = updatedSeatMap.seats[rowIndex][seatIndex];
            if (seat && seat.id === seatId) {
              updatedSeatMap.seats[rowIndex][seatIndex] = {
                ...seat,
                status: data.status,
                reserved_until: data.reserved_until
              };
              break;
            }
          }
        }
        
        setSeatMap(updatedSeatMap);
      }
    };

    wsService.on('seat_update', handleSeatUpdate);
    
    return () => {
      wsService.off('seat_update', handleSeatUpdate);
    };
  }, [seatMap]);

  // 初始化
  useEffect(() => {
    loadSeatMap();
    wsService.connect(showtimeId.toString());
    
    return () => {
      wsService.disconnect();
    };
  }, [showtimeId, loadSeatMap]);

  // 座位选择处理
  const handleSeatClick = async (seat: Seat) => {
    const isCurrentlySelected = selectedSeats.some(s => s.id === seat.id);
    
    try {
      if (isCurrentlySelected) {
        // 取消选择
        await apiService.releaseSeats(showtimeId, [seat.id], userId);
        wsService.releaseSeat(seat.id, userId);
        
        const newSelectedSeats = selectedSeats.filter(s => s.id !== seat.id);
        setSelectedSeats(newSelectedSeats);
        onSeatSelection(newSelectedSeats);
        setCountdown(null);
      } else {
        // 选择座位
        await apiService.selectSeats(showtimeId, [seat.id], userId);
        wsService.selectSeat(seat.id, userId);
        
        const newSelectedSeats = [...selectedSeats, seat];
        setSelectedSeats(newSelectedSeats);
        onSeatSelection(newSelectedSeats);
        setCountdown(15 * 60); // 15分钟倒计时
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  // 倒计时
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // 时间到，自动释放座位
      selectedSeats.forEach(seat => {
        wsService.releaseSeat(seat.id, userId);
      });
      setSelectedSeats([]);
      onSeatSelection([]);
      setCountdown(null);
    }
  }, [countdown, selectedSeats, userId, onSeatSelection]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadSeatMap}
          className="btn-primary"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!seatMap) {
    return <div className="text-center py-8">没有座位数据</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 屏幕 */}
      <div className="text-center mb-8">
        <div className="w-full h-4 bg-gradient-to-r from-transparent via-gray-800 to-transparent rounded-full mb-2"></div>
        <p className="text-sm text-gray-600">屏幕</p>
      </div>

      {/* 座位图例 */}
      <div className="flex justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="seat seat-available"></div>
          <span>可选</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="seat seat-selected"></div>
          <span>已选</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="seat seat-occupied"></div>
          <span>已售</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="seat seat-disabled"></div>
          <span>不可选</span>
        </div>
      </div>

      {/* 倒计时提示 */}
      {countdown && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>座位保留时间：{formatTime(countdown)}</span>
          </div>
        </div>
      )}

      {/* 座位网格 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-2">
          {seatMap.seats.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center">
              <div className="text-sm text-gray-500 w-8 text-center mr-4">
                {rowIndex + 1}
              </div>
              <div className="flex">
                {row.map((seat, seatIndex) => (
                  <SeatComponent
                    key={`${rowIndex}-${seatIndex}`}
                    seat={seat}
                    isSelected={seat ? selectedSeats.some(s => s.id === seat.id) : false}
                    onSeatClick={handleSeatClick}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500 w-8 text-center ml-4">
                {rowIndex + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 选中座位信息 */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">已选座位</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <span 
                key={seat.id}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {seat.row_number}排{seat.seat_number}号
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};