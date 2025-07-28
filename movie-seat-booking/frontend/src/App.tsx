import React, { useState } from 'react';
import { Movie, Showtime, Seat, Booking } from './types';
import { MovieList } from './components/MovieList';
import { ShowtimeList } from './components/ShowtimeList';
import { SeatMap } from './components/SeatMap';
import { BookingForm } from './components/BookingForm';

type AppState = 'movies' | 'showtimes' | 'seats' | 'booking' | 'success';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('movies');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentState('showtimes');
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setCurrentState('seats');
  };

  const handleSeatSelection = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  const handleProceedToBooking = () => {
    if (selectedSeats.length > 0) {
      setCurrentState('booking');
    }
  };

  const handleBookingComplete = (booking: Booking) => {
    setCurrentBooking(booking);
    setCurrentState('success');
  };

  const handleBackToMovies = () => {
    setCurrentState('movies');
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setCurrentBooking(null);
  };

  const handleBackToShowtimes = () => {
    setCurrentState('showtimes');
    setSelectedShowtime(null);
    setSelectedSeats([]);
  };

  const handleBackToSeats = () => {
    setCurrentState('seats');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🎬 电影选座系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {currentState === 'movies' && '选择电影'}
                {currentState === 'showtimes' && '选择场次'}
                {currentState === 'seats' && '选择座位'}
                {currentState === 'booking' && '确认订单'}
                {currentState === 'success' && '订单完成'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentState === 'movies' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">正在热映</h2>
            <MovieList onMovieSelect={handleMovieSelect} />
          </div>
        )}

        {currentState === 'showtimes' && selectedMovie && (
          <ShowtimeList
            movie={selectedMovie}
            onShowtimeSelect={handleShowtimeSelect}
            onBack={handleBackToMovies}
          />
        )}

        {currentState === 'seats' && selectedShowtime && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToShowtimes}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回场次选择
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-600">{selectedShowtime.cinema_name} - {selectedShowtime.theater_name}</p>
                <p className="text-sm text-gray-600">{new Date(selectedShowtime.show_date).toLocaleString('zh-CN')}</p>
              </div>
            </div>

            <SeatMap
              showtimeId={selectedShowtime.id}
              onSeatSelection={handleSeatSelection}
              userId={1}
            />

            {selectedSeats.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleProceedToBooking}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  继续订票 ({selectedSeats.length}个座位)
                </button>
              </div>
            )}
          </div>
        )}

        {currentState === 'booking' && selectedShowtime && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToSeats}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回选座
              </button>
            </div>

            <BookingForm
              showtime={selectedShowtime}
              selectedSeats={selectedSeats}
              onBookingComplete={handleBookingComplete}
              onCancel={handleBackToSeats}
              userId={1}
            />
          </div>
        )}

        {currentState === 'success' && currentBooking && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">订票成功！</h2>
              <p className="text-gray-600 mb-6">您的订单已确认，请按时观影</p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold mb-4">订单详情</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">订单号:</span> {currentBooking.booking_number}</p>
                  <p><span className="text-gray-600">状态:</span> 
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已支付
                    </span>
                  </p>
                  <p><span className="text-gray-600">总金额:</span> ¥{currentBooking.total_amount}</p>
                  <p><span className="text-gray-600">下单时间:</span> {new Date(currentBooking.booking_time).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleBackToMovies}
                  className="btn-secondary flex-1"
                >
                  继续购票
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex-1"
                >
                  打印票据
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 电影选座系统. 所有权利保留.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
