// File: src/App.jsx
// This file contains the main React application logic, including a movie list,
// star rating component, and the logic for fetching and displaying recommendations.

import { useState, useEffect } from 'react';
import './App.css';
import moviesData from './movies_with_posters.json';

/**
 * StarRating component
 * Renders a row of 5 clickable stars to allow the user to rate an item.
 * @param {number} rating - The current rating (1 through 5).
 * @param {function} onRate - Callback to update the rating when a star is clicked.
 */
function StarRating({ rating, onRate }) {
  // Define the total number of stars to display:
  const totalStars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating">
      {totalStars.map((star) => (
        <span
          key={star}
          // Apply the 'filled' class if the current star index is <= the current rating
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => onRate(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * RecMovieCard component
 * Displays a single recommended movie card, including:
 *   - A rank indicator (#1, #2, #3, etc.)
 *   - The movie poster
 *   - The movie title
 *   - A StarRating for quick user feedback
 *
 * Special rank styling: 
 *   - #1 is gold
 *   - #2 is silver
 *   - #3 is bronze
 *
 * @param {object} movie - The movie object (id, title, imageUrl, etc.)
 * @param {number} rank - The rank of the movie in the list (1-based index)
 * @param {object} ratings - A dictionary of { [movieId]: userRating }
 * @param {function} onRate - Callback function to update movie rating
 */
function RecMovieCard({ movie, rank, ratings, onRate }) {
  // Determine CSS class for special rank styling
  let rankClass = '';
  if (rank === 1) rankClass = 'rank-one';
  else if (rank === 2) rankClass = 'rank-two';
  else if (rank === 3) rankClass = 'rank-three';

  // Get the user's existing rating for this specific movie
  const userRating = ratings[movie.id] || 0;

  return (
    <div className={`rec-movie-card ${rankClass}`}>
      {/* Display the rank in the card */}
      <div className="rec-rank">#{rank}</div>
      {/* Movie poster */}
      <img src={movie.imageUrl} alt={movie.title} className="rec-image" />
      {/* Movie title */}
      <h4 className="rec-title" title={movie.title}>{movie.title}</h4>
      {/* Render star rating component for user feedback */}
      <StarRating rating={userRating} onRate={(val) => onRate(movie.id, val)} />
    </div>
  );
}

/**
 * RecCarousel component
 * Displays a horizontal list of recommended movies within a "carousel-like" wrapper.
 *
 * @param {Array} movies - Array of movie objects
 * @param {object} ratings - Dictionary of user ratings
 * @param {function} onRate - Callback to update a movie rating
 */
function RecCarousel({ movies, ratings, onRate }) {
  return (
    <div className="rec-carousel">
      {/* The container for all movie cards */}
      <div className="rec-carousel-window">
        {movies.map((m, idx) => {
          // Calculate the rank (1-based)
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

/**
 * LoadingProgress component
 * A simple progress bar that fills up from 0% to 100% over a specified duration.
 * Default duration = 82,000 ms (82 seconds).
 *
 * @param {number} duration - The total time for the bar to complete filling (in ms).
 */
function LoadingProgress({ duration = 82000 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Store the start time
    const startTime = Date.now();

    // Set up an interval to update progress every 100ms
    const timer = setInterval(() => {
      // Calculate elapsed time
      const elapsed = Date.now() - startTime;
      // Progress is the fraction of elapsed vs. duration, converted to percentage
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      // If we've reached or exceeded 100%, clear the interval
      if (p >= 100) clearInterval(timer);
    }, 100);

    // Cleanup: clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, [duration]);

  // Render a container with the colored bar that grows as progress increases
  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
}

/**
 * App component
 * The main application component that manages:
 *   - The list of movies
 *   - User ratings
 *   - Searching/filtering
 *   - The recommendation system call and display
 */
function App() {
  // State for the complete list of movies (fetched from JSON)
  const [movies, setMovies] = useState([]);

  // State for user ratings, storing movieId -> rating
  const [ratings, setRatings] = useState({});

  // State for search text (to filter movies by title)
  const [searchQuery, setSearchQuery] = useState('');

  // State for recommendation results (two lists: loveList & hateList)
  const [loveList, setLoveList] = useState([]);
  const [hateList, setHateList] = useState([]);

  // State to toggle visibility of the Rated panel
  const [showRated, setShowRated] = useState(true);

  // State to show a loading state when hitting the API
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);

  /**
   * Load the movies data from the static JSON file on initial render.
   * This is triggered once when the component mounts.
   */
  useEffect(() => {
    setMovies(moviesData);
  }, []);

  /**
   * Helper to scroll the window to the top.
   * Used when the user submits ratings so they can see the loading screen or recommendations.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Filtered movie list based on user-entered search query.
   * If the movie title includes the search text, it's displayed.
   */
  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * A list of all movies the user has rated.
   * This array is displayed in the Rated panel (if visible).
   */
  const ratedMovies = Object.keys(ratings)
    .map((idStr) => {
      const idNum = parseInt(idStr, 10);
      return movies.find((m) => m.id === idNum);
    })
    .filter(Boolean);

  /**
   * Updates the user's rating for a given movie.
   * @param {number} movieId - The unique id of the movie
   * @param {number} newVal - The new rating (1-5)
   */
  const handleRating = (movieId, newVal) => {
    setRatings((prev) => ({ ...prev, [movieId]: newVal }));
  };

  /**
   * Removes a user's rating for a movie (sets it back to not rated).
   * @param {number} movieId - The unique id of the movie
   */
  const handleRemoveRating = (movieId) => {
    setRatings((prev) => {
      const updated = { ...prev };
      delete updated[movieId];
      return updated;
    });
  };

  /**
   * Clear all ratings and recommendation results.
   */
  const handleResetAll = () => {
    setRatings({});
    setLoveList([]);
    setHateList([]);
  };

  /**
   * Submits the user's ratings to the recommendation API.
   * Receives back the top 10 and bottom 10 recommended movies, sets the results in state.
   */
  async function handleSubmit() {
    // Scroll to the top to show the loading or the final rec results
    scrollToTop();

    // Start the loading state
    setIsLoadingAPI(true);

    // Clear out any old recommendations before new ones arrive
    setLoveList([]);
    setHateList([]);

    // Convert the ratings object to an array of { movie_id, rating } objects
    const user_ratings = Object.entries(ratings).map(([id, value]) => ({
      movie_id: parseInt(id, 10),
      rating: value,
    }));

    try {
      // POST request to our Cloud Run FastAPI endpoint
      const response = await fetch(
        "https://movie-recommender-610436791059.us-central1.run.app/recommend",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_ratings }),
        }
      );

      // If the response is not OK, throw an error
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // Parse the JSON response: { top_10: [[id, score], ...], bottom_10: [[id, score], ...] }
      const data = await response.json();
      console.log("API data:", data);

      /**
       * Helper function to map an array of [id, score] to corresponding movie objects.
       * If a movie is not found in our data, return a placeholder object.
       */
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

      // Update state with top 10 and bottom 10 movies
      setLoveList(mapIdsToMovies(data.top_10 || []));
      setHateList(mapIdsToMovies(data.bottom_10 || []));
    } catch (err) {
      // Log and alert on error
      console.error("Error calling API:", err);
      alert("Failed to fetch recommendations. See console for details.");
    } finally {
      // End loading state
      setIsLoadingAPI(false);
    }
  }

  return (
    <div className="app-container">
      {/* Fixed Header Section */}
      <header className="app-header">
        <div className="header-left">
          <h2 className="header-logo">Screen Genius</h2>
        </div>

        {/* Centered Search Input */}
        <div className="header-center">
          <input
            type="text"
            placeholder="Search movies..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right side: buttons for submitting, resetting, toggling rated list, etc. */}
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

      {/* Main Page Content */}
      <div className="page-content">
        {/* If isLoadingAPI is true, display a loading section with a progress bar.
            Otherwise, if there are recommendations, display them. */}
        {isLoadingAPI ? (
          <section className="recommendations-section">
            <h2 className="recommendations-header">Loading Recommendations...</h2>
            <div className="loading-container">
              {/* Display some fun GIFs and a progress bar while loading */}
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
            // Recommendation Section: only visible if we have rec data
            <section className="recommendations-section">
              <h2 className="recommendations-header">Your Recommendations</h2>

              {/* Top 10 "Love" List */}
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

              {/* Bottom 10 "Hate" List */}
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

        {/* Main Layout: all movies on the left (filtered by search), and the rated list on the right */}
        <div className="main-layout">
          <div
            className={`movies-grid-pane ${showRated ? "with-rated" : "full-width"}`}
          >
            <h2>All Movies</h2>

            {/* If no movies match the search, display a "no results" message. Otherwise, show the movies. */}
            {filteredMovies.length === 0 ? (
              <p className="no-results">
                No results for "{searchQuery}"
              </p>
            ) : (
              <div className="movies-grid-container">
                <div className="movies-grid">
                  {filteredMovies.map((movie) => {
                    // Grab current user rating if any
                    const r = ratings[movie.id] || 0;
                    return (
                      <div key={movie.id} className="movie-card">
                        <img
                          src={movie.imageUrl}
                          alt={movie.title}
                          className="movie-image"
                        />
                        <h4 className="movie-title">{movie.title}</h4>
                        {/* Render the StarRating to let user rate the movie */}
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

          {/* The rated movies panel is displayed conditionally based on 'showRated' */}
          {showRated && (
            <aside className="rated-panel">
              <h2>Rated Movies ({ratedMovies.length})</h2>
              {/* If no movies are rated, show a placeholder */}
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
                        {/* Remove button to clear a rating from the user */}
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
