export interface Movie {
  id: number;
  title: string;
  description: string;
  duration: number;
  genre: string;
  rating: string;
  director: string;
  cast: string;
  poster_url: string;
  trailer_url: string;
  release_date: string;
}

export interface Showtime {
  id: number;
  movie_id: number;
  theater_id: number;
  show_date: string;
  price: number;
  theater_name: string;
  cinema_name: string;
}

export interface Seat {
  id: number;
  theater_id: number;
  row_number: number;
  seat_number: number;
  seat_type: 'standard' | 'vip' | 'couple' | 'disabled';
  status: 'available' | 'selected' | 'occupied' | 'reserved';
  reserved_until?: string;
}

export interface SeatMap {
  showtime_id: number;
  rows: number;
  seats_per_row: number;
  seats: (Seat | null)[][];
}

export interface Booking {
  id: number;
  booking_number: string;
  user_id: number;
  showtime_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'expired';
  booking_time: string;
  expires_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
}