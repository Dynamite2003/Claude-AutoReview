import React, { useState } from 'react';
import { Seat, Showtime, Booking } from '../types';
import { apiService } from '../services/api';

interface BookingFormProps {
  showtime: Showtime;
  selectedSeats: Seat[];
  onBookingComplete: (booking: Booking) => void;
  onCancel: () => void;
  userId?: number;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  showtime,
  selectedSeats,
  onBookingComplete,
  onCancel,
  userId = 1
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('alipay');

  const totalAmount = selectedSeats.length * showtime.price;

  const handleCreateBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('请先选择座位');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const seatIds = selectedSeats.map(seat => seat.id);
      const booking = await apiService.createBooking(showtime.id, seatIds, userId);
      
      onBookingComplete(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (bookingId: number) => {
    try {
      setLoading(true);
      setError(null);

      await apiService.confirmBooking(bookingId, paymentMethod);
      
      // 重新获取订单信息
      const updatedBooking = await apiService.getBooking(bookingId);
      onBookingComplete(updatedBooking);
    } catch (err) {
      setError(err instanceof Error ? err.message : '支付失败');
    } finally {
      setLoading(false);
    }
  };

  if (selectedSeats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-500">请先选择座位</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">确认订单</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 电影信息 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">场次信息</h3>
        <div className="bg-gray-50 rounded p-4">
          <p><span className="text-gray-600">影院:</span> {showtime.cinema_name}</p>
          <p><span className="text-gray-600">影厅:</span> {showtime.theater_name}</p>
          <p><span className="text-gray-600">时间:</span> {new Date(showtime.show_date).toLocaleString('zh-CN')}</p>
          <p><span className="text-gray-600">票价:</span> ¥{showtime.price}</p>
        </div>
      </div>

      {/* 座位信息 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">选中座位</h3>
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

      {/* 费用明细 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">费用明细</h3>
        <div className="bg-gray-50 rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <span>票价 × {selectedSeats.length}</span>
            <span>¥{totalAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>总计</span>
              <span className="text-primary-600">¥{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 支付方式 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">支付方式</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="payment"
              value="alipay"
              checked={paymentMethod === 'alipay'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span>支付宝</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="payment"
              value="wechat"
              checked={paymentMethod === 'wechat'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span>微信支付</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="payment"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span>信用卡</span>
          </label>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          取消
        </button>
        <button
          onClick={handleCreateBooking}
          className="btn-primary flex-1"
          disabled={loading || selectedSeats.length === 0}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </span>
          ) : (
            '确认并支付'
          )}
        </button>
      </div>

      {/* 温馨提示 */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• 座位选择后需在15分钟内完成支付，否则将自动释放</p>
        <p>• 电影开始前30分钟停止售票</p>
        <p>• 退票需要在电影开始前2小时申请</p>
      </div>
    </div>
  );
};