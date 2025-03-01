// File: src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import moviesData from './movies_with_posters.json';

/** StarRating: Renders 5 centered clickable stars */
function StarRating({ rating, onRate }) {
  const totalStars = [1, 2, 3, 4, 5];
  return (
    <div className="star-rating">
      {totalStars.map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => onRate(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/** RecMovieCard: A recommended movie card with special rank styling.
 * Ranks 1-3 get highlighted with gold, silver, and bronze backgrounds.
 */
function RecMovieCard({ movie, rank, ratings, onRate }) {
  let rankClass = '';
  if (rank === 1) rankClass = 'rank-one';
  else if (rank === 2) rankClass = 'rank-two';
  else if (rank === 3) rankClass = 'rank-three';

  const userRating = ratings[movie.id] || 0;

  return (
    <div className={`rec-movie-card ${rankClass}`}>
      <div className="rec-rank">#{rank}</div>
      <img src={movie.imageUrl} alt={movie.title} className="rec-image" />
      <h4 className="rec-title" title={movie.title}>{movie.title}</h4>
      <StarRating rating={userRating} onRate={(val) => onRate(movie.id, val)} />
    </div>
  );
}

/** RecCarousel: Displays all recommendation cards with wrapping.
 * All recommendation cards are shown.
 */
function RecCarousel({ movies, ratings, onRate }) {
  return (
    <div className="rec-carousel">
      <div className="rec-carousel-window">
        {movies.map((m, idx) => {
          const rank = idx + 1;
          return (
            <RecMovieCard
              key={m.id}
              movie={m}
              rank={rank}
              ratings={ratings}
              onRate={onRate}
            />
          );
        })}
      </div>
    </div>
  );
}

/** LoadingProgress: A progress bar that fills from 0% to 100% over 82 seconds */
function LoadingProgress({ duration = 82000 }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p >= 100) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [duration]);
  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
}

function App() {
  const [movies, setMovies] = useState([]);
  const [ratings, setRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Recommendations from API
  const [loveList, setLoveList] = useState([]);
  const [hateList, setHateList] = useState([]);

  const [showRated, setShowRated] = useState(true);
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);

  useEffect(() => {
    setMovies(moviesData);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ratedMovies = Object.keys(ratings)
    .map((idStr) => {
      const idNum = parseInt(idStr, 10);
      return movies.find((m) => m.id === idNum);
    })
    .filter(Boolean);

  const handleRating = (movieId, newVal) => {
    setRatings((prev) => ({ ...prev, [movieId]: newVal }));
  };

  const handleRemoveRating = (movieId) => {
    setRatings((prev) => {
      const updated = { ...prev };
      delete updated[movieId];
      return updated;
    });
  };

  const handleResetAll = () => {
    setRatings({});
    setLoveList([]);
    setHateList([]);
  };

  // Call the API endpoint and update recommendations
  async function handleSubmit() {
    scrollToTop();
    setIsLoadingAPI(true);
    setLoveList([]);
    setHateList([]);

    const user_ratings = Object.entries(ratings).map(([id, value]) => ({
      movie_id: parseInt(id, 10),
      rating: value,
    }));

    try {
      const response = await fetch(
        "https://movie-recommender-610436791059.us-central1.run.app/recommend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_ratings }),
        }
      );
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("API data:", data);

      function mapIdsToMovies(arr) {
        return arr.map(([id, score]) => {
          const found = movies.find((m) => m.id === id);
          return found || {
            id,
            title: `Movie ${id} (No Info)`,
            imageUrl: "https://via.placeholder.com/140x210?text=No+Poster",
          };
        });
      }
      setLoveList(mapIdsToMovies(data.top_10 || []));
      setHateList(mapIdsToMovies(data.bottom_10 || []));
    } catch (err) {
      console.error("Error calling API:", err);
      alert("Failed to fetch recommendations. See console for details.");
    } finally {
      setIsLoadingAPI(false);
    }
  }

  return (
    <div className="app-container">
      {/* Fixed Header */}
      <header className="app-header">
        <div className="header-left">
          <h2 className="header-logo">Screen Genius</h2>
        </div>
        <div className="header-center">
          <input
            type="text"
            placeholder="Search movies..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={handleSubmit}>
            Submit
          </button>
          <button className="header-btn" onClick={handleResetAll}>
            Reset
          </button>
          <button
            className="header-btn"
            onClick={() => setShowRated((prev) => !prev)}
          >
            {showRated ? "Hide Rated" : "Show Rated"}
          </button>
          <button className="header-btn" onClick={scrollToTop}>
            Top
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content">
        {/* Recommendations Section */}
        {isLoadingAPI ? (
          <section className="recommendations-section">
            <h2 className="recommendations-header">
              Loading Recommendations...
            </h2>
            <div className="loading-container">
              <img
                src="gif1.gif"
                alt="Loading GIF 1"
                className="loading-gif"
              />
              <LoadingProgress duration={82000} />
              <img
                src="gif2.gif"
                alt="Loading GIF 2"
                className="loading-gif"
              />
            </div>
          </section>
        ) : (
          (loveList.length > 0 || hateList.length > 0) && (
            <section className="recommendations-section">
              <h2 className="recommendations-header">
                Your Recommendations
              </h2>
              <div className="rec-block">
                <h3>Movies You'll Love</h3>
                {loveList.length === 0 ? (
                  <p>No love recs yet.</p>
                ) : (
                  <RecCarousel
                    movies={loveList}
                    ratings={ratings}
                    onRate={handleRating}
                  />
                )}
              </div>
              <div className="rec-block">
                <h3>Movies You'll Hate</h3>
                {hateList.length === 0 ? (
                  <p>No hate recs yet.</p>
                ) : (
                  <RecCarousel
                    movies={hateList}
                    ratings={ratings}
                    onRate={handleRating}
                  />
                )}
              </div>
            </section>
          )
        )}

        {/* Main Layout: All Movies Grid and Rated Panel */}
        <div className="main-layout">
          <div
            className={`movies-grid-pane ${
              showRated ? "with-rated" : "full-width"
            }`}
          >
            <h2>All Movies</h2>
            {filteredMovies.length === 0 ? (
              <p className="no-results">
                No results for "{searchQuery}"
              </p>
            ) : (
              <div className="movies-grid-container">
                <div className="movies-grid">
                  {filteredMovies.map((movie) => {
                    const r = ratings[movie.id] || 0;
                    return (
                      <div key={movie.id} className="movie-card">
                        <img
                          src={movie.imageUrl}
                          alt={movie.title}
                          className="movie-image"
                        />
                        <h4 className="movie-title">{movie.title}</h4>
                        <StarRating
                          rating={r}
                          onRate={(val) => handleRating(movie.id, val)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {showRated && (
            <aside className="rated-panel">
              <h2>Rated Movies ({ratedMovies.length})</h2>
              {ratedMovies.length === 0 ? (
                <p>You haven't rated anything yet.</p>
              ) : (
                <div className="rated-list">
                  {ratedMovies.map((movie) => {
                    const r = ratings[movie.id];
                    return (
                      <div key={movie.id} className="rated-item">
                        <div className="rated-info">
                          <img
                            src={movie.imageUrl}
                            alt={movie.title}
                            className="rated-image"
                          />
                          <div>
                            <h4>{movie.title}</h4>
                            <StarRating
                              rating={r}
                              onRate={(val) => handleRating(movie.id, val)}
                            />
                          </div>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveRating(movie.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
