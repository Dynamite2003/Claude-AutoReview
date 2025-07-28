import { Movie, Showtime, SeatMap, Booking } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Movies API
  async getMovies(skip = 0, limit = 20): Promise<Movie[]> {
    return this.request(`/movies?skip=${skip}&limit=${limit}`);
  }

  async getMovie(movieId: number): Promise<Movie> {
    return this.request(`/movies/${movieId}`);
  }

  async getMovieShowtimes(movieId: number, date?: string): Promise<Showtime[]> {
    const dateParam = date ? `?date=${date}` : '';
    return this.request(`/movies/${movieId}/showtimes${dateParam}`);
  }

  // Seats API
  async getSeatMap(showtimeId: number): Promise<SeatMap> {
    return this.request(`/seats/showtime/${showtimeId}/seatmap`);
  }

  async selectSeats(showtimeId: number, seatIds: number[], userId?: number): Promise<any> {
    return this.request(`/seats/showtime/${showtimeId}/select`, {
      method: 'POST',
      body: JSON.stringify({ seat_ids: seatIds, user_id: userId }),
    });
  }

  async releaseSeats(showtimeId: number, seatIds: number[], userId?: number): Promise<any> {
    return this.request(`/seats/showtime/${showtimeId}/release`, {
      method: 'POST',
      body: JSON.stringify({ seat_ids: seatIds, user_id: userId }),
    });
  }

  // Bookings API
  async createBooking(showtimeId: number, seatIds: number[], userId?: number): Promise<Booking> {
    return this.request('/bookings/', {
      method: 'POST',
      body: JSON.stringify({
        showtime_id: showtimeId,
        seat_ids: seatIds,
        user_id: userId,
      }),
    });
  }

  async getBookings(userId?: number, skip = 0, limit = 20): Promise<Booking[]> {
    const userParam = userId ? `user_id=${userId}&` : '';
    return this.request(`/bookings?${userParam}skip=${skip}&limit=${limit}`);
  }

  async getBooking(bookingId: number): Promise<Booking> {
    return this.request(`/bookings/${bookingId}`);
  }

  async confirmBooking(bookingId: number, paymentMethod: string): Promise<any> {
    return this.request(`/bookings/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod }),
    });
  }

  async cancelBooking(bookingId: number): Promise<any> {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();