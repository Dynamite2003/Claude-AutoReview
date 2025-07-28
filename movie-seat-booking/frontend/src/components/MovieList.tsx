import React, { useEffect, useState } from 'react';
import { Movie } from '../types';
import { apiService } from '../services/api';

interface MovieListProps {
  onMovieSelect: (movie: Movie) => void;
}

export const MovieList: React.FC<MovieListProps> = ({ onMovieSelect }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMovies();
      setMovies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载电影列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 rounded-lg h-80 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadMovies} className="btn-primary">
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
          onClick={() => onMovieSelect(movie)}
        >
          <div className="relative h-80">
            <img
              src={movie.poster_url || '/placeholder-movie.jpg'}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-movie.jpg';
              }}
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {movie.rating}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2 truncate">{movie.title}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{movie.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{movie.genre}</span>
              <span>{movie.duration}分钟</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>导演: {movie.director}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};