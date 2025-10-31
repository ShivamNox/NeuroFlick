    const apiKey = "19cc925a8d46c04caebe6afe9d0107e3";
    const posterBaseURL = "https://image.tmdb.org/t/p/w500";
    let movieHistory = [];
    let currentIndex = -1;
    let favorites = [];

    // Genre state
    let currentGenreId = null;
    let currentGenreType = "movie";
    let currentPage = 1;
    let currentGenreName = "";

    // Initialize favorites from memory (in-memory storage)
    const favoritesStore = {
      data: [],
      get: function() {
        return this.data;
      },
      set: function(value) {
        this.data = value;
      }
    };

    favorites = favoritesStore.get();

    // Page Management
    function showPage(pageId) {
      document.querySelectorAll('.page-container').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById(pageId).classList.add('active');
    }

    // Loading state
    function showLoading() {
      document.getElementById("loading-popup").classList.add('show');
    }

    function hideLoading() {
      document.getElementById("loading-popup").classList.remove('show');
    }

    // Error handling
    function displayError(message) {
      alert(message);
      hideLoading();
    }

    // Favorites functionality
    function toggleFavorite() {
      if (currentIndex === -1 || !movieHistory[currentIndex]) return;
      
      const movie = movieHistory[currentIndex];
      const index = favorites.findIndex(fav => fav.title === movie.title);
      
      if (index > -1) {
        favorites.splice(index, 1);
      } else {
        favorites.push(movie);
      }
      
      favoritesStore.set(favorites);
      updateFavoriteButton(movie);
    }

    function updateFavoriteButton(movie) {
      const isFavorite = favorites.some(fav => fav.title === movie.title);
      const btn = document.getElementById('favorite-btn');
      btn.textContent = isFavorite ? '❤️ Favorited' : 'Add in 🤍 Favorite';
    }

    // Favorites modal functions
    function showFavoritesModal() {
      const modal = document.getElementById('favorites-modal');
      const favoritesList = document.getElementById('favorites-list');
      const noFavorites = document.getElementById('no-favorites');
      
      if (favorites.length === 0) {
        favoritesList.innerHTML = '';
        noFavorites.style.display = 'block';
      } else {
        noFavorites.style.display = 'none';
        favoritesList.innerHTML = favorites.map((movie, index) => `
          <div class="favorite-item" onclick="loadFavoriteMovie(${index})">
            <img class="favorite-poster" src="${movie.poster || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgODAgMTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI2MCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='}" alt="${movie.title}" />
            <div class="favorite-info">
              <div class="favorite-title">${movie.title}</div>
              <div class="favorite-details">${movie.type === 'movie' ? 'Movie 🎬' : 'Series 📺'} • ${movie.rating}</div>
              <div class="favorite-details">${movie.release} • ${movie.runtime}</div>
              <div class="favorite-overview">${movie.overview.substring(0, 100)}${movie.overview.length > 100 ? '...' : ''}</div>
            </div>
            <button class="remove-favorite" onclick="event.stopPropagation(); removeFavorite(${index})">
              🗑️
            </button>
          </div>
        `).join('');
      }
      
      modal.style.display = 'block';
    }

    function closeFavoritesModal() {
      document.getElementById('favorites-modal').style.display = 'none';
    }

    function loadFavoriteMovie(index) {
      const movie = favorites[index];
      movieHistory.push(movie);
      currentIndex = movieHistory.length - 1;
      displayMovie(movie);
      closeFavoritesModal();
      showPage('home-page');
    }

    function removeFavorite(index) {
      if (confirm('क्या आप इस movie को favorites से remove करना चाहते हैं?')) {
        favorites.splice(index, 1);
        favoritesStore.set(favorites);
        showFavoritesModal();
        
        if (currentIndex >= 0 && movieHistory[currentIndex]) {
          updateFavoriteButton(movieHistory[currentIndex]);
        }
      }
    }

    // Translation function
    async function translateToHindi(text) {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        return data[0][0][0];
      } catch (err) {
        console.warn("Translation failed:", err);
        return text;
      }
    }

    // Fetch content
    async function fetchRandomContent() {
      showLoading();
      const typeFilter = document.getElementById("type-filter").value;
      const type = typeFilter || (Math.random() < 0.5 ? "movie" : "tv");
      const page = Math.floor(Math.random() * 500) + 1;

      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=${apiKey}&language=en-US&page=${page}`);
        const data = await res.json();
        const randomItem = data.results[Math.floor(Math.random() * data.results.length)];

        const detailsRes = await fetch(`https://api.themoviedb.org/3/${type}/${randomItem.id}?api_key=${apiKey}&language=en-US`);
        const item = await detailsRes.json();

        const translatedOverview = await translateToHindi(item.overview || "");

        hideLoading();
        return {
          type,
          title: type === "movie" ? (item.title || "N/A") : (item.name || "N/A"),
          overview: translatedOverview || "N/A",
          rating: item.vote_average + " / 10",
          release: type === "movie" ? (item.release_date || "Unknown") : (item.first_air_date || "Unknown"),
          runtime: type === "movie"
            ? (item.runtime ? `${item.runtime} mins` : "Unknown")
            : (item.episode_run_time?.length ? `${item.episode_run_time[0]} mins/ep` : "Unknown"),
          genres: item.genres.map(g => g.name),
          poster: item.poster_path ? posterBaseURL + item.poster_path : ""
        };

      } catch (err) {
        hideLoading();
        console.error("Fetch error:", err);
        displayError("Failed to fetch content. Please try again.");
        return null;
      }
    }

    // Display movie
    function displayMovie(movie) {
      document.getElementById("movie-title").textContent = movie.title;
      document.getElementById("movie-type").textContent = movie.type === "movie" ? "Movie 🎬" : "Series 📺";
      document.getElementById("movie-rating").textContent = movie.rating;
      document.getElementById("movie-release").textContent = movie.release;
      document.getElementById("movie-runtime").textContent = movie.runtime;
      document.getElementById("movie-genres").innerHTML = movie.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('');
      document.getElementById("movie-overview").textContent = movie.overview;

      const posterEl = document.getElementById("movie-poster");
      posterEl.src = movie.poster || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMmEyYTJhIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjI1IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE4Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+";
      posterEl.alt = movie.title;
      
      updateFavoriteButton(movie);
    }

    // Navigation
    async function nextMovie() {
      if (currentIndex < movieHistory.length - 1) {
        currentIndex++;
        displayMovie(movieHistory[currentIndex]);
      } else {
        const content = await fetchRandomContent();
        if (content) {
          movieHistory.push(content);
          currentIndex++;
          displayMovie(content);
        }
      }
    }

    function previousMovie() {
      if (currentIndex > 0) {
        currentIndex--;
        displayMovie(movieHistory[currentIndex]);
      }
    }

    // Search functionality
    async function searchContent(query) {
      if (!query.trim()) return;
      
      showLoading();
      const typeFilter = document.getElementById("type-filter").value;
      
      try {
        let searches = [];
        
        if (!typeFilter || typeFilter === 'movie') {
          searches.push(fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`));
        }
        if (!typeFilter || typeFilter === 'tv') {
          searches.push(fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`));
        }

        const responses = await Promise.all(searches);
        const data = await Promise.all(responses.map(r => r.json()));
        
        let allResults = [];
        data.forEach((d, index) => {
          const type = (!typeFilter || typeFilter === 'movie') && index === 0 ? 'movie' : 'tv';
          allResults.push(...d.results.map(item => ({...item, searchType: type})));
        });

        if (allResults.length === 0) {
          hideLoading();
          displayError("No matching movie or series found.");
          return;
        }

        const bestResult = allResults.sort((a, b) => b.popularity - a.popularity)[0];
        const type = bestResult.searchType;

        const detailsRes = await fetch(`https://api.themoviedb.org/3/${type}/${bestResult.id}?api_key=${apiKey}&language=en-US`);
        const details = await detailsRes.json();

        const translatedOverview = await translateToHindi(details.overview || "");

        const result = {
          type,
          title: type === "movie" ? (details.title || "N/A") : (details.name || "N/A"),
          overview: translatedOverview || "N/A",
          rating: details.vote_average + " / 10",
          release: type === "movie" ? (details.release_date || "Unknown") : (details.first_air_date || "Unknown"),
          runtime: type === "movie"
            ? (details.runtime ? `${details.runtime} mins` : "Unknown")
            : (details.episode_run_time?.length ? `${details.episode_run_time[0]} mins/ep` : "Unknown"),
          genres: details.genres.map(g => g.name),
          poster: details.poster_path ? posterBaseURL + details.poster_path : ""
        };

        movieHistory.push(result);
        currentIndex = movieHistory.length - 1;
        displayMovie(result);
        hideLoading();

      } catch (error) {
        hideLoading();
        console.error("Search failed:", error);
        displayError("Error while searching. Please try again.");
      }
    }

    // Genre functionality
    async function showGenrePage() {
      showPage('genre-page');
      showLoading();
      
      try {
        const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`);
        const movieGenres = await res.json();
        const res2 = await fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}&language=en-US`);
        const tvGenres = await res2.json();

        // Combine and remove duplicates
        const allGenres = [...movieGenres.genres];
        tvGenres.genres.forEach(tvGenre => {
          if (!allGenres.find(g => g.id === tvGenre.id)) {
            allGenres.push(tvGenre);
          }
        });

        const container = document.getElementById("genres-list");
        container.innerHTML = allGenres.map(g => `
          <button class="genre-btn" data-id="${g.id}" data-name="${g.name}">${g.name}</button>
        `).join("");

        container.querySelectorAll(".genre-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const name = btn.getAttribute("data-name");
            openGenreContent(id, name);
          });
        });

        hideLoading();
      } catch (error) {
        hideLoading();
        displayError("Failed to load genres. Please try again.");
      }
    }

    async function openGenreContent(genreId, genreName) {
      currentGenreId = genreId;
      currentGenreType = "movie";
      currentGenreName = genreName;
      currentPage = 1;

      showPage('genre-content-page');
      document.getElementById("genre-title-heading").textContent = genreName;
      document.getElementById("genre-subtitle").textContent = `Browse ${genreName} Movies & Series`;
      document.getElementById("genre-items").innerHTML = '';

      await loadGenreItems();
    }

    async function loadGenreItems() {
      showLoading();
      const container = document.getElementById("genre-items");
      
      try {
        const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${currentGenreId}&page=${currentPage}&sort_by=popularity.desc`);
        const data = await res.json();
        const results = data.results;

        const html = await Promise.all(results.map(async (item) => {
          const title = item.title || item.name || "Unknown";
          const poster = item.poster_path ? posterBaseURL + item.poster_path : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjI3MCIgdmlld0JveD0iMCAwIDE4MCAyNzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMjcwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjkwIiB5PSIxMzUiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";
          const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
          const overview = item.overview || "No description available";
          
          // Translate overview to Hindi
          const translatedOverview = await translateToHindi(overview.substring(0, 150));
          
          return `
            <div class="item-card" onclick="loadGenreMovie(${item.id}, 'movie')">
              <img src="${poster}" alt="${title}" />
              <div class="item-info">
                <div class="item-title">${title}</div>
                <div class="item-rating">
                  <i class="fa fa-star"></i>
                  <span>${rating}/10</span>
                </div>
                <div class="item-overview">${translatedOverview}...</div>
              </div>
            </div>
          `;
        }));

        if (currentPage === 1) {
          container.innerHTML = html.join('');
        } else {
          container.insertAdjacentHTML("beforeend", html.join(''));
        }

        const btn = document.getElementById("load-more-btn");
        if (currentPage < data.total_pages && currentPage < 10) {
          btn.style.display = "block";
        } else {
          btn.style.display = "none";
        }

        hideLoading();
      } catch (error) {
        hideLoading();
        displayError("Failed to load items. Please try again.");
      }
    }

    async function loadGenreMovie(movieId, type) {
      showLoading();
      
      try {
        const detailsRes = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}?api_key=${apiKey}&language=en-US`);
        const item = await detailsRes.json();

        const translatedOverview = await translateToHindi(item.overview || "");

        const movie = {
          type,
          title: type === "movie" ? (item.title || "N/A") : (item.name || "N/A"),
          overview: translatedOverview || "N/A",
          rating: item.vote_average + " / 10",
          release: type === "movie" ? (item.release_date || "Unknown") : (item.first_air_date || "Unknown"),
          runtime: type === "movie"
            ? (item.runtime ? `${item.runtime} mins` : "Unknown")
            : (item.episode_run_time?.length ? `${item.episode_run_time[0]} mins/ep` : "Unknown"),
          genres: item.genres.map(g => g.name),
          poster: item.poster_path ? posterBaseURL + item.poster_path : ""
        };

        movieHistory.push(movie);
        currentIndex = movieHistory.length - 1;
        displayMovie(movie);
        showPage('home-page');
        hideLoading();
      } catch (error) {
        hideLoading();
        displayError("Failed to load movie details. Please try again.");
      }
    }

    // Debounce function
    function debounce(func, delay) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    }

    // Event handlers
    const handleSearch = () => {
      const query = document.getElementById("search-input").value.trim();
      if (query) searchContent(query);
    };

    const debouncedSearch = debounce(handleSearch, 600);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      
      const activePage = document.querySelector('.page-container.active').id;
      if (activePage !== 'home-page') return;
      
      switch(e.key.toLowerCase()) {
        case 'arrowleft':
          e.preventDefault();
          previousMovie();
          break;
        case 'arrowright':
        case ' ':
          e.preventDefault();
          nextMovie();
          break;
        case 'f':
          e.preventDefault();
          document.getElementById('search-input').focus();
          break;
        case 'v':
          e.preventDefault();
          showFavoritesModal();
          break;
        case 'g':
          e.preventDefault();
          showGenrePage();
          break;
      }
    });

    // Event listeners
    document.getElementById("search-btn").addEventListener("click", handleSearch);
    document.getElementById("search-input").addEventListener("input", debouncedSearch);
    document.getElementById("search-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    });

    document.getElementById("next-btn-bottom").addEventListener("click", nextMovie);
    document.getElementById("back-btn-bottom").addEventListener("click", previousMovie);
    document.getElementById("favorite-btn").addEventListener("click", toggleFavorite);
    document.getElementById("view-favorites-btn").addEventListener("click", showFavoritesModal);
    document.getElementById("browse-genres-btn").addEventListener("click", showGenrePage);

    document.querySelector('.close').addEventListener('click', closeFavoritesModal);
    document.getElementById('favorites-modal').addEventListener('click', (e) => {
      if (e.target.id === 'favorites-modal') {
        closeFavoritesModal();
      }
    });

    document.getElementById("load-more-btn").addEventListener("click", () => {
      currentPage++;
      loadGenreItems();
    });

    document.getElementById("back-to-genres-btn").addEventListener("click", showGenrePage);
    document.getElementById("back-to-home-btn").addEventListener("click", () => {
      showPage('home-page');
    });

    // Initialize app
    window.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      const searchQuery = params.get("search");
      
      if (view === "genre" || view === "genres") {
        showGenrePage();
      } else if (searchQuery) {
        const query = searchQuery.replace(/-/g, " ");
        document.getElementById("search-input").value = query;
        searchContent(query);
      } else {
        nextMovie();
      }
    });
