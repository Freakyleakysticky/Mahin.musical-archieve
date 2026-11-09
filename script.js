/* ============================================================
   mahin.gay — script.js
   Content is loaded from content.js
   ============================================================ */

(function () {
  "use strict";

  /* ==========================================================
     CONTENT
     ========================================================== */

  if (typeof SITE_CONTENT === "undefined") {
    console.error("mahin.gay: content.js could not be loaded.");
    return;
  }

  var BACKGROUNDS = SITE_CONTENT.backgrounds || [];
  var ARTISTS = (SITE_CONTENT.artists || []).slice();
  var PLAYLISTS = SITE_CONTENT.playlists || [];
  var FLOATING_ARTISTS = SITE_CONTENT.floatingArtists || [];
  var PLAYER_ROTATION_TIME = SITE_CONTENT.playerRotationTime || 25000;


  /* ==========================================================
     UTIL
     ========================================================== */

  function shuffle(array) {
    var result = array.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = result[i];
      result[i] = result[j];
      result[j] = t;
    }
    return result;
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function setText(elements, text) {
    elements.forEach(function (el) { if (el) el.textContent = text; });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Storage can throw (private mode, blocked cookies). Never let it
     take the whole page down. */
  function storeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function sessionGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function sessionSet(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} }

  /* Player icons are inline SVG: they never depend on fonts or file
     encoding, so they can't turn into stray letters again. */
  var SVG_OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">';
  var ICON_PLAY = SVG_OPEN + '<path fill="currentColor" d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z"/></svg>';
  var ICON_PAUSE = SVG_OPEN + '<path fill="currentColor" d="M6.5 5h3.7v14H6.5zM13.8 5h3.7v14h-3.7z"/></svg>';
  var ICON_SPEAKER = '<path fill="currentColor" d="M4 9.5v5h3.6l4.4 3.8V5.7L7.6 9.5z"/>';
  var ICON_VOL_MUTE = SVG_OPEN + ICON_SPEAKER + '<path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  var ICON_VOL_LOW = SVG_OPEN + ICON_SPEAKER + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  var ICON_VOL_HIGH = SVG_OPEN + ICON_SPEAKER + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

  /* YouTube playlist IDs are 18+ characters (usually 34). A shorter
     one was cut off when pasted and can never load. */
  function validYouTubePlaylist(id) {
    return typeof id === "string" && /^[A-Za-z0-9_-]{18,}$/.test(id);
  }


  /* ==========================================================
     STATIC CONTENT FROM content.js
     ========================================================== */

  (function initStaticContent() {

    var content = SITE_CONTENT;

    if (content.hero) {
      var heroKicker = document.getElementById("heroKicker");
      var heroTitle = document.getElementById("heroTitle");
      var heroSubtitle = document.getElementById("heroSubtitle");
      if (heroKicker) heroKicker.textContent = content.hero.kicker || "";
      if (heroTitle) heroTitle.textContent = content.hero.title || "";
      if (heroSubtitle) heroSubtitle.textContent = content.hero.subtitle || "";
    }

    if (content.gate) {
      var quoteEl = document.getElementById("gateQuote");
      var authorEl = document.getElementById("gateQuoteAuthor");
      var enterLabel = document.getElementById("gateEnterLabel");
      var gateSub = document.getElementById("gateSub");
      if (quoteEl) quoteEl.textContent = content.gate.quote || "";
      if (authorEl) authorEl.textContent = content.gate.quoteAuthor || "";
      if (enterLabel) enterLabel.textContent = content.gate.enterLabel || "ENTER";
      if (gateSub) gateSub.textContent = content.gate.sub || "";
    }

    if (content.footer) {
      var footerMain = document.getElementById("footerMain");
      var footerScrawl = document.getElementById("footerScrawl");
      if (footerMain) footerMain.textContent = content.footer.main || "";
      if (footerScrawl) footerScrawl.textContent = content.footer.scrawl || "";
    }

  })();


  /* ==========================================================
     GATE PORTRAITS
     A handful of artist photos, spread evenly across the
     catalogue, as the GTA-style vertical panels.
     ========================================================== */

  (function initGatePortraits() {

    var wrap = document.getElementById("gatePortraits");
    if (!wrap || !ARTISTS.length) return;

    var PANEL_COUNT = Math.min(5, ARTISTS.length);
    var step = ARTISTS.length / PANEL_COUNT;
    var html = "";

    for (var i = 0; i < PANEL_COUNT; i++) {

      var artist = ARTISTS[Math.floor(i * step)];
      var img = (artist.images && artist.images[0]) ||
        (artist.groups && artist.groups[0] && artist.groups[0].images[0]) || "";

      if (!img) continue;

      html += '<div class="gate-portrait" style="background-image:url(\'' +
        img.replace(/'/g, "%27") + '\')"></div>';
    }

    wrap.innerHTML = html;

  })();


  /* ==========================================================
     BOOT SEQUENCE
     A couple of short typed lines, then the ENTER button arms.
     ========================================================== */

  var bootReady = false;
  var bootFinish = null;

  (function initGateBoot() {

    var bootEl = document.getElementById("gateBoot");
    var enterBtn = document.getElementById("gateEnter");
    if (!bootEl) return;

    var lines = (SITE_CONTENT.gate && SITE_CONTENT.gate.bootLines) || [];
    var pendingTimeouts = [];

    function clearPending() {
      pendingTimeouts.forEach(clearTimeout);
      pendingTimeouts = [];
    }

    function armEnter() {
      if (bootReady) return;
      bootReady = true;
      if (enterBtn) {
        enterBtn.disabled = false;
        enterBtn.classList.add("boot-enter-ready");
        enterBtn.focus({ preventScroll: true });
      }
    }

    bootFinish = function () {
      clearPending();
      if (!bootEl.dataset.done) {
        bootEl.innerHTML = "";
        lines.forEach(function (text) {
          var line = document.createElement("span");
          line.className = "gate-boot-line done";
          line.textContent = text;
          bootEl.appendChild(line);
        });
        bootEl.dataset.done = "1";
      }
      armEnter();
    };

    if (!lines.length || reduceMotion) {
      bootFinish();
      return;
    }

    var lineIndex = 0, charIndex = 0, typeSpeed = 16, lineEl = null, textSpan = null;

    function typeNextChar() {

      if (lineIndex >= lines.length) { armEnter(); return; }

      var text = lines[lineIndex];

      if (charIndex === 0) {
        lineEl = document.createElement("span");
        lineEl.className = "gate-boot-line done";
        textSpan = document.createElement("span");
        lineEl.appendChild(textSpan);
        var cursor = document.createElement("span");
        cursor.className = "gate-boot-cursor";
        lineEl.appendChild(cursor);
        bootEl.appendChild(lineEl);
      }

      if (charIndex < text.length) {
        textSpan.textContent = text.slice(0, charIndex + 1);
        charIndex++;
        pendingTimeouts.push(setTimeout(typeNextChar, typeSpeed));
      } else {
        lineIndex++;
        charIndex = 0;
        pendingTimeouts.push(setTimeout(typeNextChar, 200));
      }

    }

    pendingTimeouts.push(setTimeout(typeNextChar, 240));

  })();


  /* ==========================================================
     PAGE CONTENT — nav / rack / artist sections
     ========================================================== */

  function photoHTML(url, focus) {
    return '<div class="photo"><img src="' + escapeHTML(url) + '" loading="lazy" alt=""' +
      (focus ? ' style="object-position:' + escapeHTML(focus) + '"' : '') + '></div>';
  }

  function trackListHTML(tracks) {
    return '<ul class="tracklist">' +
      tracks.map(function (tr, i) {
        return '<li><span><span class="no">' + String(i + 1).padStart(2, "0") + '</span>' +
          '<a href="https://open.spotify.com/track/' + escapeHTML(tr[1]) +
          '" target="_blank" rel="noopener">' + escapeHTML(tr[0]) + '</a></span></li>';
      }).join("") +
      '</ul>';
  }

  function artistSectionHTML(a) {


    var embed = "";

    if (a.playlist) {
      embed = '<div class="embed-wrap"><iframe src="https://open.spotify.com/embed/playlist/' +
        escapeHTML(a.playlist) + '?utm_source=generator&theme=0" height="152" title="' +
        escapeHTML(a.name) + ' Spotify playlist" allow="encrypted-media" loading="lazy"></iframe></div>';
    } else if (a.album) {
      embed = '<div class="embed-wrap"><iframe src="https://open.spotify.com/embed/album/' +
        escapeHTML(a.album) + '?utm_source=generator&theme=0" height="152" title="' +
        escapeHTML(a.name) + ' Spotify album" allow="encrypted-media" loading="lazy"></iframe></div>';
    }

    var tracks = a.tracks ? trackListHTML(a.tracks) : "";
    var collage;

    if (a.groups) {
      collage = a.groups.map(function (g) {
        return '<div class="group-label">' + escapeHTML(g.label) + '</div>' +
          '<div class="collage">' + g.images.map(photoHTML).join("") + '</div>';
      }).join("");
    } else {
      collage = '<div class="collage">' + (a.images || []).map(photoHTML).join("") + '</div>';
    }

    return '<section class="artist" id="' + escapeHTML(a.id) + '">' +
      '<div class="artist-side">' +
        '<span class="tag" style="background:' + escapeHTML(a.accent) + '">favorite</span>' +
        '<h2>' + escapeHTML(a.name) + '</h2>' + embed + tracks +
      '</div>' +
      '<div class="artist-main">' + collage + '</div>' +
    '</section>';
  }

  function rackHTML() {

    var rackContent = SITE_CONTENT.playlistSection || {};
    var kicker = rackContent.kicker || "a few mixes I keep on repeat";
    var title = rackContent.title || "playlists";

    return '<div class="rack-title"><span class="kicker">' + escapeHTML(kicker) +
      '</span><h2>' + escapeHTML(title) + '</h2></div>' +
      '<div class="rack">' +
        PLAYLISTS.map(function (p) {

          var body = p[1]
            ? '<div class="embed-wrap"><iframe src="https://open.spotify.com/embed/playlist/' +
              escapeHTML(p[1]) + '?utm_source=generator&theme=0" height="152" title="' +
              escapeHTML(p[0]) + ' Spotify playlist" allow="encrypted-media" loading="lazy"></iframe></div>'
            : '<div class="rack-placeholder">coming soon</div>';

          return '<figure><figcaption>' + escapeHTML(p[0]) + '</figcaption>' + body + '</figure>';

        }).join("") +
      '</div>';

  }

  var mainEl = document.getElementById("main");
  if (mainEl) mainEl.innerHTML = rackHTML() + ARTISTS.map(artistSectionHTML).join("");

  var navEl = document.getElementById("nav");
  if (navEl) {
    navEl.innerHTML = ARTISTS.map(function (a) {
      return '<a href="#' + escapeHTML(a.id) + '">' + escapeHTML(a.name) + '</a>';
    }).join("");
  }


  /* ==========================================================
     SPOTIFY EMBED -> FLOATING PLAYER BRIDGE
     The playlist embed itself remains the single audio source. The floating
     player mirrors its track/state and sends play, pause and seek commands to
     that same embed, avoiding two copies playing over one another.
     ========================================================== */

  var spotifyIFrameAPI = null;
  var spotifyIFrameApiLoading = false;
  var spotifyIFrameApiCallbacks = [];
  var spotifyControllers = [];
  var activeSpotifyController = null;
  var spotifyModeActive = false;
  var spotifyPlaying = false;
  var spotifyCurrentURI = '';
  var spotifyPositionSeconds = 0;
  var spotifyDurationSeconds = 0;
  var spotifyMetadataCache = {};
  var spotifyLastMetadataURI = '';

  function ensureSpotifyIFrameAPI(callback) {
    if (spotifyIFrameAPI) { callback(spotifyIFrameAPI); return; }
    spotifyIFrameApiCallbacks.push(callback);
    if (spotifyIFrameApiLoading) return;
    spotifyIFrameApiLoading = true;
    window.onSpotifyIframeApiReady = function (api) {
      spotifyIFrameAPI = api;
      spotifyIFrameApiLoading = false;
      var pending = spotifyIFrameApiCallbacks.slice();
      spotifyIFrameApiCallbacks = [];
      pending.forEach(function (fn) { try { fn(api); } catch (err) { console.error('Spotify embed init failed:', err); } });
    };
    var script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    script.onerror = function () {
      spotifyIFrameApiLoading = false;
      console.error('Spotify iFrame API could not be loaded; falling back to standard Spotify embeds.');
      var pending = spotifyIFrameApiCallbacks.slice();
      spotifyIFrameApiCallbacks = [];
      pending.forEach(function (fn) { try { fn(null); } catch (err) {} });
    };
    document.head.appendChild(script);
  }

  function spotifyURIToURL(uri) {
    if (!uri) return '';
    if (/^https?:\/\//i.test(uri)) return uri;
    var match = String(uri).match(/^spotify:(track|episode|album|playlist|show|artist):([A-Za-z0-9]+)$/);
    return match ? 'https://open.spotify.com/' + match[1] + '/' + match[2] : '';
  }

  // Spotify's oEmbed response gives a track title and artwork, but its
  // author_name is always the provider. Use Apple's public catalogue search
  // to resolve the performing artist and a full-track duration. Audio still
  // plays only in the Spotify embed; this lookup is metadata-only.
  function lookupSpotifyTrackMetadata(uri, publicURL, embedMeta, durationHint) {
    var fallback = {
      title: (embedMeta && embedMeta.title) || 'Spotify track',
      artist: '',
      image: (embedMeta && embedMeta.thumbnail_url) || '',
      duration: 0,
      url: publicURL || ''
    };
    if (!/^spotify:track:[A-Za-z0-9]+$/.test(String(uri || '')) || !window.fetch || !fallback.title || fallback.title === 'Spotify track') {
      return Promise.resolve(fallback);
    }
    var searchURL = 'https://itunes.apple.com/search?term=' + encodeURIComponent(fallback.title) + '&entity=song&limit=25&country=US';
    return fetch(searchURL).then(function (response) {
      if (!response.ok) throw new Error('Track metadata lookup failed');
      return response.json();
    }).then(function (catalogue) {
      var results = Array.isArray(catalogue.results) ? catalogue.results : [];
      function norm(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\b(remaster(ed)?|radio edit|single version|album version|explicit|clean)\b/g, '')
          .replace(/[^a-z0-9]+/g, ' ').trim();
      }
      var wanted = norm(fallback.title);
      var hint = Number(durationHint) || 0;
      var ranked = results.map(function (item) {
        var candidate = norm(item.trackName), score = candidate === wanted ? 100 :
          (candidate && wanted && (candidate.indexOf(wanted) >= 0 || wanted.indexOf(candidate) >= 0) ? 40 : -100);
        if (hint > 0 && Number(item.trackTimeMillis) > 0) score -= Math.min(30, Math.abs(item.trackTimeMillis / 1000 - hint) * 1.5);
        return { item: item, score: score };
      }).sort(function (a, b) { return b.score - a.score; });
      var best = ranked.length && ranked[0].score > 0 ? ranked[0].item : null;
      if (!best) return fallback;
      var artwork = best.artworkUrl600 || best.artworkUrl100 || '';
      if (artwork) artwork = artwork.replace(/\d+x\d+bb\./, '600x600bb.');
      return {
        title: best.trackName || fallback.title,
        artist: best.artistName || '',
        image: fallback.image || artwork,
        duration: Number(best.trackTimeMillis) > 0 ? best.trackTimeMillis / 1000 : 0,
        url: fallback.url,
        album: best.collectionName || ''
      };
    }).catch(function () { return fallback; });
  }

  function requestSpotifyTrackMetadata(uri, publicURL, durationHint) {
    var fallback = { title: 'Spotify track', artist: '', image: '', duration: 0, url: publicURL || '' };
    if (!publicURL || !window.fetch) return Promise.resolve(fallback);
    return fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(publicURL))
      .then(function (response) { if (!response.ok) throw new Error('Spotify metadata unavailable'); return response.json(); })
      .then(function (meta) { return lookupSpotifyTrackMetadata(uri, publicURL, meta || {}, durationHint); })
      .catch(function () { return lookupSpotifyTrackMetadata(uri, publicURL, { title: fallback.title }, durationHint); });
  }

  function updateFloatingPlayerFromSpotify(controller, state) {
    if (!state) return;
    var uri = state.playingURI || spotifyCurrentURI;
    if (!uri) return;
    if (!state.isPaused) activeSpotifyController = controller;
    if (controller !== activeSpotifyController && state.isPaused) return;

    var changedTrack = spotifyCurrentURI !== uri;
    if (changedTrack) {
      // Never carry the last track's artwork timing into a newly selected song.
      spotifyPositionSeconds = 0;
      spotifyDurationSeconds = 0;
    }
    var incomingPosition = Number(state.position);
    var incomingDuration = Number(state.duration) / 1000;
    if (isFinite(incomingPosition) && incomingPosition >= 0 && state.position != null) {
      spotifyPositionSeconds = incomingPosition / 1000;
    }
    // Spotify can emit duration=0 for music tracks. Preserve a valid duration
    // already received or resolved from the public music catalogue.
    if (isFinite(incomingDuration) && incomingDuration > 0) spotifyDurationSeconds = incomingDuration;

    spotifyModeActive = true;
    spotifyCurrentURI = uri;
    spotifyPlaying = !state.isPaused;
    playerPlaying = spotifyPlaying;

    if (youtubePlayer && youtubeReady) {
      try { if (youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) youtubePlayer.pauseVideo(); } catch (err) {}
    }
    if (floatingArtist) floatingArtist.classList.add('spotify-mode');
    var existingMetadata = spotifyMetadataCache[uri];
    setText(nameEls, existingMetadata && existingMetadata.artist ? existingMetadata.artist : 'looking up artist…');
    if (!existingMetadata) setText(songEls, 'loading track info…');
    if (prevBtnEls) prevBtnEls.forEach(function (btn) { if (btn) btn.title = 'Use the Spotify playlist to change tracks'; });
    if (nextBtnEls) nextBtnEls.forEach(function (btn) { if (btn) btn.title = 'Use the Spotify playlist to change tracks'; });
    if (volumeEls) volumeEls.forEach(function (el) { if (el) el.disabled = true; });
    updatePlayButton();
    updateSeekUI(spotifyPositionSeconds, spotifyDurationSeconds);
    paintRotation();

    if (spotifyLastMetadataURI !== uri) {
      spotifyLastMetadataURI = uri;
      var cached = spotifyMetadataCache[uri];
      if (cached) {
        applySpotifyMetadata(cached);
      } else {
        requestSpotifyTrackMetadata(uri, spotifyURIToURL(uri), spotifyDurationSeconds).then(function (meta) {
          spotifyMetadataCache[uri] = meta;
          if (spotifyModeActive && spotifyLastMetadataURI === uri) applySpotifyMetadata(meta);
        });
      }
    } else if (spotifyMetadataCache[uri]) {
      applySpotifyMetadata(spotifyMetadataCache[uri]);
    }
    if (spotifyPlaying) startSeekPolling(); else stopSeekPolling();
  }

  function applySpotifyMetadata(meta) {
    if (!meta) return;
    setText(nameEls, meta.artist || 'artist unavailable');
    setText(songEls, meta.title || 'Spotify track');
    if (meta.image) imageEls.forEach(function (img) {
      if (!img) return;
      if (img.src !== meta.image) img.src = meta.image;
      img.alt = (meta.title || 'Spotify track') + (meta.artist ? ' by ' + meta.artist : '') + ' cover';
    });
    // The actual Spotify duration wins; use catalogue duration when the
    // embed doesn't expose one, so the floating seek bar spans the full song.
    if (!(spotifyDurationSeconds > 0) && Number(meta.duration) > 0) {
      spotifyDurationSeconds = Number(meta.duration);
      updateSeekUI(spotifyPositionSeconds, spotifyDurationSeconds);
      paintRotation();
    }
  }

  function deactivateSpotifyMirror() {
    if (!spotifyModeActive) return;
    try { if (activeSpotifyController) activeSpotifyController.pause(); } catch (err) {}
    activeSpotifyController = null;
    spotifyModeActive = false;
    spotifyPlaying = false;
    if (floatingArtist) floatingArtist.classList.remove('spotify-mode');
    if (prevBtnEls) prevBtnEls.forEach(function (btn) { if (btn) btn.title = 'Previous'; });
    if (nextBtnEls) nextBtnEls.forEach(function (btn) { if (btn) btn.title = 'Next'; });
    if (volumeEls) volumeEls.forEach(function (el) { if (el) el.disabled = false; });
  }

  /* ==========================================================
     WIDGETS — clock, year progress, artist roulette, 8-ball,
     dice, session timer, accent colour picker
     ========================================================== */

  (function initWidgets() {

    var el = document.getElementById("widgets");
    if (!el) return;
    var $ = function (id) { return document.getElementById(id); };
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    var swatches = ["#eee7d8", "#ff4f9a", "#7cf5c4", "#6ea8ff", "#ffb347", "#c792ff"];

    el.innerHTML =
      '<div class="widget"><span class="widget-label">dhaka time</span>' +
        '<b class="widget-big" id="wgClock">--:--:--</b><span class="widget-sub" id="wgDate"></span></div>' +

      '<div class="widget"><span class="widget-label">year progress</span>' +
        '<b class="widget-big" id="wgYearPct">0%</b>' +
        '<div class="widget-bar"><i id="wgYearFill"></i></div><span class="widget-sub" id="wgYearSub"></span></div>' +

      '<div class="widget"><span class="widget-label">artist roulette</span>' +
        '<b class="widget-big widget-small" id="wgArtist">—</b>' +
        '<button type="button" class="widget-btn" id="wgPick">spin</button></div>' +

      '<div class="widget"><span class="widget-label">ask the archive</span>' +
        '<b class="widget-big widget-small" id="wgAnswer">ask me anything</b>' +
        '<button type="button" class="widget-btn" id="wgAsk">shake</button></div>' +

      '<div class="widget"><span class="widget-label">dice</span>' +
        '<b class="widget-big widget-dice" id="wgDice">⚀ ⚀</b>' +
        '<button type="button" class="widget-btn" id="wgRoll">roll</button></div>' +

      '<div class="widget"><span class="widget-label">time on site</span>' +
        '<b class="widget-big" id="wgSession">00:00</b><span class="widget-sub" id="wgSessionSub">just arrived</span></div>' +

      '<div class="widget"><span class="widget-label">scroll depth</span>' +
        '<b class="widget-big" id="wgScroll">0%</b>' +
        '<div class="widget-bar"><i id="wgScrollFill"></i></div></div>' +

      '<div class="widget"><span class="widget-label">accent colour</span>' +
        '<div class="widget-swatches" id="wgSwatches">' +
        swatches.map(function (c, i) {
          return '<button type="button" class="swatch' + (i === 0 ? ' is-active' : '') + '" data-c="' + c +
            '" style="background:' + c + '" aria-label="Accent ' + c + '"></button>';
        }).join("") + '</div><span class="widget-sub">changes the whole site</span></div>';

    /* clock + year progress */
    function tick() {
      var now = new Date();
      try {
        $("wgClock").textContent = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour12: false });
        $("wgDate").textContent = now.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long" });
      } catch (err) {
        $("wgClock").textContent = now.toLocaleTimeString();
        $("wgDate").textContent = now.toDateString();
      }
      var y = now.getFullYear(), start = new Date(y, 0, 1), end = new Date(y + 1, 0, 1);
      var pct = (now - start) / (end - start) * 100;
      $("wgYearPct").textContent = pct.toFixed(1) + "%";
      $("wgYearFill").style.width = pct.toFixed(2) + "%";
      $("wgYearSub").textContent = Math.ceil((end - now) / 86400000) + " days left in " + y;
    }
    tick();
    setInterval(tick, 1000);

    /* artist roulette: flickers through names, then lands */
    var names = ARTISTS.map(function (a) { return a.name; }).filter(Boolean);
    var spinning = false;
    function spin() {
      if (!names.length || spinning) return;
      spinning = true;
      var n = 0;
      var t = setInterval(function () {
        $("wgArtist").textContent = pick(names);
        if (++n > 12) { clearInterval(t); spinning = false; }
      }, 55);
    }
    spin();
    $("wgPick").addEventListener("click", spin);

    /* 8-ball */
    var answers = ["yes.", "no.", "listen to more kanye.", "ask again later.", "obviously.",
      "the archive says maybe.", "skip to the chorus.", "definitely not.", "turn the volume up.",
      "go touch grass, then come back."];
    $("wgAsk").addEventListener("click", function () {
      var a = $("wgAnswer");
      a.classList.remove("widget-pop"); void a.offsetWidth;
      a.textContent = pick(answers);
      a.classList.add("widget-pop");
    });

    /* dice */
    var faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    $("wgRoll").addEventListener("click", function () {
      var d = $("wgDice"), n = 0;
      var t = setInterval(function () {
        d.textContent = pick(faces) + " " + pick(faces);
        if (++n > 8) clearInterval(t);
      }, 60);
    });

    /* session timer */
    var began = Date.now();
    setInterval(function () {
      var s = Math.floor((Date.now() - began) / 1000);
      var m = Math.floor(s / 60);
      $("wgSession").textContent = String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      $("wgSessionSub").textContent = m >= 10 ? "you live here now" : m >= 3 ? "staying a while, nice" : "just arrived";
    }, 1000);

    /* scroll depth */
    function paintScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      $("wgScroll").textContent = Math.round(p) + "%";
      $("wgScrollFill").style.width = p.toFixed(1) + "%";
    }
    window.addEventListener("scroll", paintScroll, { passive: true });
    paintScroll();

    /* accent colour: sets --accent on the whole page, remembered */
    function setAccent(c) {
      document.documentElement.style.setProperty("--accent", c);
      Array.prototype.forEach.call(document.querySelectorAll(".swatch"), function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-c") === c);
      });
    }
    try { var saved = localStorage.getItem("siteAccent"); if (saved) setAccent(saved); } catch (err) {}
    $("wgSwatches").addEventListener("click", function (e) {
      var b = e.target.closest(".swatch");
      if (!b) return;
      var c = b.getAttribute("data-c");
      setAccent(c);
      try { localStorage.setItem("siteAccent", c); } catch (err) {}
    });

  })();

  /* cursor glow: a soft light that follows the mouse (desktop only) */
  (function initCursorGlow() {
    var g = document.getElementById("cursorGlow");
    if (!g || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    window.addEventListener("pointermove", function (e) {
      g.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      g.style.opacity = "1";
    }, { passive: true });
    document.addEventListener("mouseleave", function () { g.style.opacity = "0"; });
  })();

  /* ==========================================================
     SECRET PANEL EXTENSION — 100+ terminal commands, lab widgets,
     and the ANIME corner (content comes from SITE_CONTENT.anime)
     ========================================================== */

  (function initSecretExtension() {

    var AN = SITE_CONTENT.anime || {};
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function pre(s) { return '<pre class="egg-pre">' + esc(s) + "</pre>"; }
    function rnd(n) { return Math.floor(Math.random() * n); }
    function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) {} }
    function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
    var started = Date.now();

    /* ---------- falling-emoji effect (sakura, snow, stars, hearts) ---------- */
    var fallCv = null, fallRaf = 0;
    function falling(emoji, count) {
      var same = window.__fallEmoji === emoji;
      if (fallCv) { cancelAnimationFrame(fallRaf); fallCv.remove(); fallCv = null; window.__fallEmoji = ""; if (same) return false; }
      window.__fallEmoji = emoji;
      fallCv = document.createElement("canvas");
      fallCv.className = "egg-fx egg-fx-top"; fallCv.style.opacity = ".9";
      fallCv.width = innerWidth; fallCv.height = innerHeight;
      document.body.appendChild(fallCv);
      var ctx = fallCv.getContext("2d"), ps = [];
      for (var i = 0; i < (count || 45); i++) ps.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: 12 + Math.random() * 16, v: .6 + Math.random() * 1.6, d: Math.random() * 6, w: Math.random() * 2 });
      (function f() {
        ctx.clearRect(0, 0, fallCv.width, fallCv.height);
        ps.forEach(function (p) { p.y += p.v; p.d += .03; p.x += Math.sin(p.d) * (.6 + p.w); if (p.y > fallCv.height + 20) { p.y = -20; p.x = Math.random() * fallCv.width; } ctx.font = p.s + "px serif"; ctx.fillText(emoji, p.x, p.y); });
        fallRaf = requestAnimationFrame(f);
      })();
      return true;
    }

    /* ---------- morse / text helpers ---------- */
    var MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
    function toMorse(t) { return t.toLowerCase().split("").map(function (c) { return c === " " ? "/" : (MORSE[c] || ""); }).filter(Boolean).join(" "); }
    function rot13(t) { return t.replace(/[a-z]/gi, function (c) { var b = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); }
    function caesar(t, n) { n = ((n % 26) + 26) % 26; return t.replace(/[a-z]/gi, function (c) { var b = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + n) % 26 + b); }); }
    function toBin(t) { return t.split("").map(function (c) { return c.charCodeAt(0).toString(2).padStart(8, "0"); }).join(" "); }
    function b64(t) { try { return btoa(unescape(encodeURIComponent(t))); } catch (e) { return "error"; } }
    function unb64(t) { try { return decodeURIComponent(escape(atob(t))); } catch (e) { return "invalid base64"; } }
    function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
    function isPrime(n) { if (n < 2 || n % 1) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
    function cow(t) { var l = "-".repeat(t.length + 2); return " " + l + "\n< " + t + " >\n " + l + "\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||"; }
    function num(x) { var n = parseFloat(x); return isNaN(n) ? null : n; }
    function divergence() { return "0." + String(rnd(1000000)).padStart(6, "0"); }

    var NAMES = ["Raku", "Chitoge", "Kosaki", "Marika", "Tsugumi", "Hachiman", "Yukino", "Yui", "Iroha", "Saika", "Okabe", "Kurisu", "Mayuri", "Daru", "Suzuha", "Faris", "Ruka", "Moeka"];
    var KAOMOJI = ["(◕‿◕)♡", "(≧▽≦)", "(｡•́︿•̀｡)", "ヽ(>∀<☆)ノ", "(╯°□°）╯︵ ┻━┻", "¯\\_(ツ)_/¯", "(づ｡◕‿‿◕｡)づ", "(｡♥‿♥｡)", "(*^‿^*)", "૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა", "(ノ´ヮ`)ノ*:･ﾟ✧", "( ˘ ³˘)♥", "(¬_¬)", "(T_T)", "(^_−)☆", "ʕ•ᴥ•ʔ", "(•ω•)", "(o´∀`o)"];

    /* ==========================================================
       TERMINAL COMMANDS
       ========================================================== */

    window.EGG_CMDS = function (cmds, t) {
      var META = {}, CATS = {};
      var colors = { hotpink: "#ff4f9a", mint: "#7cf5c4", sky: "#6ea8ff", amber: "#ffb347", violet: "#c792ff", cream: "#eee7d8", red: "#ff5c5c", lime: "#b6ff5c", sakura: "#ffb7c5", orange: "#ff9f1c" };
      var API = window.EGG_API || {};
      var cat = "misc";
      function def(name, desc, fn) { cmds[name] = fn; META[name] = desc; (CATS[cat] = CATS[cat] || []).push(name); }
      function A(a, i) { return a[i] === undefined ? "" : a[i]; }
      function html(s) { return s; }

      /* ----- SYSTEM ----- */
      cat = "system";
      def("date", "today's date", function () { return new Date().toDateString(); });
      def("uptime", "time you've been here", function () { var s = Math.floor((Date.now() - started) / 1000); return Math.floor(s / 60) + "m " + (s % 60) + "s on this page"; });
      def("version", "panel version", function () { return "secret.exe v2.0 — anime edition"; });
      def("screen", "your screen size", function () { return screen.width + "×" + screen.height + " (window " + innerWidth + "×" + innerHeight + ")"; });
      def("lang", "browser language", function () { return esc(navigator.language || "unknown"); });
      def("platform", "your platform", function () { return esc(navigator.platform || "unknown"); });
      def("cores", "CPU cores", function () { return (navigator.hardwareConcurrency || "?") + " logical cores"; });
      def("online", "network status", function () { return navigator.onLine ? "online" : "offline"; });
      def("url", "current page address", function () { return esc(location.href); });
      def("pagetitle", "page title", function () { return esc(document.title); });
      def("commands", "how many commands exist", function () { return Object.keys(cmds).length + " commands installed."; });
      def("motd", "message of the day", function () { return pick(["today is a good day to rewatch something.", "hydrate. then anime.", "the worldline is stable. probably.", "be kind, be curious, be cozy."]); });
      def("pwd", "where you are", function () { return "/secret/anime-corner/you-are-here"; });
      def("ls", "list panel sections", function () { return "terminal  tools  lab  anime  notes  fun  about"; });
      def("neofetch", "system info with style", function () {
        return pre("  (\\_/)     visitor@mahin.gay\n  (o.o)     -----------------\n  (> <)     os: " + (navigator.platform || "?") + "\n            screen: " + screen.width + "x" + screen.height + "\n            lang: " + (navigator.language || "?") + "\n            artists: " + ARTISTS.length + "\n            commands: " + Object.keys(cmds).length + "\n            uptime: " + Math.floor((Date.now() - started) / 1000) + "s");
      });

      /* ----- TEXT TOOLS ----- */
      cat = "text";
      def("echo", "repeat text", function (a, raw) { return esc(raw); });
      def("reverse", "reverse text", function (a, raw) { return esc(raw.split("").reverse().join("")); });
      def("upper", "UPPERCASE", function (a, raw) { return esc(raw.toUpperCase()); });
      def("lower", "lowercase", function (a, raw) { return esc(raw.toLowerCase()); });
      def("capitalize", "Title Case", function (a, raw) { return esc(raw.replace(/\b\w/g, function (c) { return c.toUpperCase(); })); });
      def("rot13", "rot13 cipher", function (a, raw) { return esc(rot13(raw)); });
      def("caesar", "caesar <n> <text>", function (a, raw, args) { var n = num(args[0]); if (n === null) return "usage: caesar 3 hello"; return esc(caesar(args.slice(1).join(" "), n)); });
      def("base64", "encode to base64", function (a, raw) { return esc(b64(raw)); });
      def("unbase64", "decode base64", function (a, raw) { return esc(unb64(raw)); });
      def("binary", "text to binary", function (a, raw) { return esc(toBin(raw)); });
      def("unbinary", "binary to text", function (a, raw) { try { return esc(raw.trim().split(/\s+/).map(function (b) { return String.fromCharCode(parseInt(b, 2)); }).join("")); } catch (e) { return "invalid"; } });
      def("hex", "text to hex", function (a, raw) { return esc(raw.split("").map(function (c) { return c.charCodeAt(0).toString(16).padStart(2, "0"); }).join(" ")); });
      def("morse", "text to morse", function (a, raw) { return esc(toMorse(raw)); });
      def("leet", "1337 speak", function (a, raw) { return esc(raw.replace(/[aeiost]/gi, function (c) { return { a: "4", e: "3", i: "1", o: "0", s: "5", t: "7" }[c.toLowerCase()]; })); });
      def("mock", "sPoNgEbOb tExT", function (a, raw) { return esc(raw.split("").map(function (c, i) { return i % 2 ? c.toUpperCase() : c.toLowerCase(); }).join("")); });
      def("clap", "add 👏 between 👏 words", function (a, raw) { return esc(raw.split(/\s+/).join(" 👏 ")); });
      def("shout", "LOUD!!!", function (a, raw) { return esc(raw.toUpperCase() + "!!!"); });
      def("whisper", "quiet...", function (a, raw) { return esc("…" + raw.toLowerCase() + "…"); });
      def("palindrome", "is it a palindrome?", function (a, raw) { var s = raw.toLowerCase().replace(/[^a-z0-9]/g, ""); return s && s === s.split("").reverse().join("") ? "yes, it's a palindrome" : "nope"; });
      def("slugify", "make-a-url-slug", function (a, raw) { return esc(raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); });
      def("repeat", "repeat <n> <text>", function (a, raw, args) { var n = Math.min(50, num(args[0]) || 0); return n ? esc(Array(n + 1).join(args.slice(1).join(" ") + " ")) : "usage: repeat 3 hi"; });
      def("sortwords", "sort words A→Z", function (a, raw) { return esc(raw.split(/\s+/).sort().join(" ")); });
      def("charcount", "count characters", function (a, raw) { return raw.length + " characters"; });
      def("wordcount", "count words", function (a, raw) { return (raw.trim() ? raw.trim().split(/\s+/).length : 0) + " words"; });
      def("vowels", "count vowels", function (a, raw) { return ((raw.match(/[aeiou]/gi) || []).length) + " vowels"; });

      /* ----- MATH ----- */
      cat = "math";
      def("calc", "calc <expression>", function (a, raw) { if (!/^[0-9+\-*/.()%\s]+$/.test(raw) || !raw) return "usage: calc 2*(3+4)"; try { return String(+Function('"use strict";return (' + raw + ")")().toFixed(10)); } catch (e) { return "error"; } });
      def("rand", "rand [min] [max]", function (a, raw, args) { var lo = num(args[0]), hi = num(args[1]); if (lo === null) { lo = 0; hi = 100; } if (hi === null) { hi = lo; lo = 0; } return String(lo + rnd(hi - lo + 1)); });
      def("factorial", "factorial <n>", function (a) { var n = num(a); if (n === null || n < 0 || n > 20) return "give a number 0–20"; var r = 1; for (var i = 2; i <= n; i++) r *= i; return String(r); });
      def("fib", "fibonacci <n>", function (a) { var n = num(a); if (n === null || n < 1 || n > 40) return "give 1–40"; var x = 0, y = 1, o = []; for (var i = 0; i < n; i++) { o.push(x); var z = x + y; x = y; y = z; } return o.join(", "); });
      def("isprime", "isprime <n>", function (a) { var n = num(a); return n === null ? "give a number" : (isPrime(n) ? n + " is prime" : n + " is not prime"); });
      def("primes", "primes up to <n>", function (a) { var n = Math.min(500, num(a) || 50), o = []; for (var i = 2; i <= n; i++) if (isPrime(i)) o.push(i); return o.join(", "); });
      def("gcd", "gcd <a> <b>", function (a, r, args) { var x = num(args[0]), y = num(args[1]); return x === null || y === null ? "usage: gcd 12 18" : String(gcd(x, y)); });
      def("lcm", "lcm <a> <b>", function (a, r, args) { var x = num(args[0]), y = num(args[1]); return x === null || y === null ? "usage: lcm 4 6" : String(Math.abs(x * y) / gcd(x, y)); });
      def("sqrt", "square root", function (a) { var n = num(a); return n === null ? "give a number" : String(Math.sqrt(n)); });
      def("pow", "pow <base> <exp>", function (a, r, args) { var x = num(args[0]), y = num(args[1]); return x === null || y === null ? "usage: pow 2 10" : String(Math.pow(x, y)); });
      def("bin2dec", "binary → decimal", function (a) { return /^[01]+$/.test(a || "") ? String(parseInt(a, 2)) : "give a binary number"; });
      def("dec2bin", "decimal → binary", function (a) { var n = num(a); return n === null ? "give a number" : Math.floor(n).toString(2); });
      def("hex2dec", "hex → decimal", function (a) { return /^[0-9a-f]+$/i.test(a || "") ? String(parseInt(a, 16)) : "give a hex number"; });
      def("avg", "average of numbers", function (a, r, args) { var n = args.map(num).filter(function (x) { return x !== null; }); return n.length ? String(n.reduce(function (s, x) { return s + x; }, 0) / n.length) : "usage: avg 1 2 3"; });
      def("sum", "sum of numbers", function (a, r, args) { var n = args.map(num).filter(function (x) { return x !== null; }); return n.length ? String(n.reduce(function (s, x) { return s + x; }, 0)) : "usage: sum 1 2 3"; });
      def("percent", "percent <part> <whole>", function (a, r, args) { var x = num(args[0]), y = num(args[1]); return x === null || !y ? "usage: percent 25 200" : (x / y * 100).toFixed(2) + "%"; });
      def("c2f", "celsius → fahrenheit", function (a) { var n = num(a); return n === null ? "give a number" : (n * 9 / 5 + 32).toFixed(1) + " °F"; });
      def("f2c", "fahrenheit → celsius", function (a) { var n = num(a); return n === null ? "give a number" : ((n - 32) * 5 / 9).toFixed(1) + " °C"; });
      def("km2mi", "km → miles", function (a) { var n = num(a); return n === null ? "give a number" : (n * .621371).toFixed(2) + " mi"; });
      def("kg2lb", "kg → pounds", function (a) { var n = num(a); return n === null ? "give a number" : (n * 2.20462).toFixed(2) + " lb"; });

      /* ----- FUN & CUTE ----- */
      cat = "fun";
      def("8ball", "ask the 8-ball", function () { return pick(["yes.", "no.", "ask again later.", "signs point to yes.", "very doubtful.", "without a doubt.", "my sources say no."]); });
      def("cowsay", "cowsay <text>", function (a, raw) { return pre(cow(raw || "moo")); });
      def("fortune", "a fortune", function () { return pick(["a rewatch is in your future.", "you will find a new favourite character soon.", "someone is thinking of you. probably.", "the next episode will be better than you expect."]); });
      def("joke", "a bad joke", function () { return pick(["why did the anime protagonist cross the road? to power up on the other side.", "i told my wifi to behave. it buffered.", "what do you call a sleepy otaku? a nap-ime."]); });
      def("pun", "a pun", function () { return pick(["i'm reading a book about anti-gravity. it's impossible to put down.", "this site has great potential. it's all about the sakura-casm."]); });
      def("tsundere", "tsundere mode", function () { return pick(["i-it's not like i wanted you to visit or anything, b-baka!", "hmph. fine. you can stay. but only because i'm bored.", "d-don't get the wrong idea! i just happened to save your seat!"]); });
      def("rate", "rate <thing>", function (a, raw) { return esc(raw || "that") + ": " + (1 + rnd(10)) + "/10"; });
      def("ship", "ship <a> <b>", function (a, r, args) { if (args.length < 2) return "usage: ship Raku Chitoge"; var s = 0; (args[0] + args[1]).split("").forEach(function (c) { s += c.charCodeAt(0); }); return esc(args[0]) + " 💗 " + esc(args[1]) + " = " + (s % 101) + "% compatible"; });
      def("roast", "a gentle roast", function () { return pick(["you rewatch the same three shows and call it 'curating'.", "your watchlist is longer than your attention span.", "you said 'one more episode' four episodes ago."]); });
      def("compliment", "a compliment", function () { return pick(["your taste in music is genuinely good.", "you built a whole secret panel. that's iconic.", "you have main character energy."]); });
      def("hug", "a hug", function () { return "(づ｡◕‿‿◕｡)づ  *hug*"; });
      def("pat", "headpat", function () { return "(｡•́‿•̀｡)  *pat pat*"; });
      def("waifu", "random character", function () { return "✦ " + esc(pick(NAMES)); });
      def("husbando", "random character (again)", function () { return "✦ " + esc(pick(NAMES)); });
      def("kaomoji", "random kaomoji", function () { var k = pick(KAOMOJI); copy(k); return esc(k) + "  (copied)"; });
      def("lenny", "lenny face", function () { return "( ͡° ͜ʖ ͡°)"; });
      def("tableflip", "flip a table", function () { return "(╯°□°）╯︵ ┻━┻"; });
      def("unflip", "put the table back", function () { return "┬─┬ ノ( ゜-゜ノ)"; });
      def("shrug", "shrug", function () { return "¯\\_(ツ)_/¯"; });
      def("sparkle", "sparkles", function () { return "✧･ﾟ: *✧･ﾟ:*  ✨  *:･ﾟ✧*:･ﾟ✧"; });
      def("uwu", "uwuify text", function (a, raw) { return esc(raw.replace(/[rl]/g, "w").replace(/[RL]/g, "W") + " uwu"); });
      def("nya", "nya~", function () { return "nya~ ฅ^•ﻌ•^ฅ"; });
      def("senpai", "senpai notice me", function () { return "senpai noticed you. (・ω・)ノ"; });
      def("baka", "b-baka!", function () { return "b-baka!! ( >д<)"; });
      def("nani", "nani?!", function () { return "NANI?!"; });
      def("kawaii", "kawaii overload", function () { return "★ K A W A I I ★  ♡ ♡ ♡"; });

      /* ----- ANIME ----- */
      cat = "anime";
      def("watchlist", "your favourites list", function () { var f = AN.favourites || []; return f.length ? f.map(function (x) { return "• " + esc(x.title) + (x.rating ? " — " + esc(x.rating) + "/10" : "") + " [" + esc(x.status || "?") + "]"; }).join("<br>") : "empty. edit content.js → anime.favourites"; });
      def("favs", "same as watchlist", function () { return cmds.watchlist(); });
      def("special", "your special lists", function () { var s = AN.specials || []; return s.length ? s.map(function (x) { return "★ " + esc(x.title); }).join("<br>") : "none yet"; });
      def("moment", "random anime moment", function () { var m = AN.moments || []; if (!m.length) return "none yet"; var x = pick(m); return "<b>" + esc(x.anime) + "</b> — " + esc(x.title) + "<br>" + esc(x.text); });
      def("diary", "latest diary entry", function () { var d = AN.diary || []; if (!d.length) return "no entries"; return "<b>" + esc(d[0].date) + "</b> " + esc(d[0].title) + "<br>" + esc(d[0].text); });
      def("nisekoi", "open the Nisekoi page", function () { t.openTab("anime"); t.openAnime("nisekoi"); return "opening… ♡"; });
      def("oregairu", "open the Oregairu page", function () { t.openTab("anime"); t.openAnime("oregairu"); return "opening… the club room is open."; });
      def("steins", "open the Steins;Gate page", function () { t.openTab("anime"); t.openAnime("steinsgate"); return "opening… el psy kongroo."; });
      def("idea", "a post idea", function () { return "💡 " + esc(pick(AN.ideas || ["write a diary entry"])); });
      def("divergence", "read the divergence meter", function () { return "<span class=\"egg-nixie\">" + divergence() + "</span>"; });
      def("worldline", "random worldline", function () { return "worldline " + divergence() + (Math.random() < .03 ? " — STEINS GATE reached." : ""); });
      def("dmail", "dmail <message>", function (a, raw) { if (!raw) return "usage: dmail don't skip breakfast"; return "D-Mail sent to the past: “" + esc(raw) + "”<br>" + esc(pick((AN.steinsgate || {}).dmailReplies || ["sent."])) + "<br>new divergence: " + divergence(); });
      def("kongroo", "el psy…", function () { return "El. Psy. Kongroo."; });
      def("tuturu", "tuturu~", function () { return "tuturu~ ☆"; });
      def("yahallo", "a cheerful greeting", function () { return "yahallo!! ✧"; });
      def("gacha", "pull a character", function () { var r = Math.random(), star = r < .03 ? "★★★★★" : r < .15 ? "★★★★" : "★★★"; var l = []; ["nisekoi", "oregairu"].forEach(function (k) { ((AN[k] || {}).characters || []).forEach(function (c) { l.push(c.name); }); }); return star + "  " + esc(pick(l.length ? l : NAMES)); });
      def("request", "ask the Service Club", function () { return esc(pick(((AN.oregairu || {}).requests) || ["request noted."])); });

      /* ----- SITE CONTROL ----- */
      cat = "site";
      def("accent", "accent <name|#hex>", function (a) { var c = colors[a] || (/^#[0-9a-f]{3,8}$/i.test(a || "") ? a : ""); if (!c) return "usage: accent hotpink | accent #ff00aa"; API.setAccent(c); return "accent → " + c; });
      def("colors", "list colour names", function () { return Object.keys(colors).join(", "); });
      def("theme", "theme nisekoi|oregairu|steins", function (a) { var m = { nisekoi: "#ff8fb3", oregairu: "#6ea8ff", steins: "#7cf5c4", steinsgate: "#ff9f1c" }; if (!m[a]) return "usage: theme nisekoi | oregairu | steins"; API.setAccent(m[a]); return "theme → " + a; });
      def("matrix", "matrix rain", function () { return API.toggleMatrix() ? "wake up…" : "matrix off."; });
      def("confetti", "party!", function () { API.confetti(); return "🎉"; });
      def("sakura", "falling petals", function () { return falling("🌸", 40) ? "🌸 petals on" : "petals off"; });
      def("snow", "falling snow", function () { return falling("❄️", 60) ? "❄️ snow on" : "snow off"; });
      def("stars", "falling stars", function () { return falling("✨", 40) ? "✨ stars on" : "stars off"; });
      def("hearts", "falling hearts", function () { return falling("💗", 35) ? "💗 hearts on" : "hearts off"; });
      def("invert", "invert colours", function () { document.documentElement.classList.toggle("egg-invert"); return "toggled"; });
      def("mirror", "mirror the site", function () { document.documentElement.classList.toggle("egg-mirror"); return "toggled"; });
      def("spin", "spin the page", function () { var r = document.documentElement; r.classList.add("egg-spin"); setTimeout(function () { r.classList.remove("egg-spin"); }, 1300); return "wheee"; });
      def("shake", "earthquake", function () { var r = document.documentElement; r.classList.add("egg-shake"); setTimeout(function () { r.classList.remove("egg-shake"); }, 900); return "rumble"; });
      def("glitch", "glitch the page", function () { var r = document.documentElement; r.classList.add("egg-glitch"); setTimeout(function () { r.classList.remove("egg-glitch"); }, 1200); return "ẗ̷h̷e̷ ̷w̷o̷r̷l̷d̷l̷i̷n̷e̷ ̷s̷h̷i̷f̷t̷s̷"; });
      def("rainbow", "rainbow accent", function () { var h = 0, n = 0, id = setInterval(function () { h = (h + 8) % 360; document.documentElement.style.setProperty("--accent", "hsl(" + h + ",90%,65%)"); if (++n > 90) clearInterval(id); }, 70); return "🌈"; });
      def("zen", "hide clutter", function () { document.documentElement.classList.toggle("egg-zen"); return "zen toggled"; });
      def("widgets", "toggle widgets row", function () { var w = document.getElementById("widgets"); if (!w) return "no widgets"; w.hidden = !w.hidden; return w.hidden ? "widgets hidden" : "widgets shown"; });
      def("reset", "undo effects", function () { var r = document.documentElement; r.classList.remove("egg-invert", "egg-mirror", "egg-spin", "egg-shake", "egg-glitch", "egg-zen"); if (fallCv) falling(window.__fallEmoji); return "site restored"; });
      def("clear", "clear screen", function () { t.term.innerHTML = ""; return null; });
      def("history", "past commands", function () { return t.hist.map(function (h, i) { return (i + 1) + "  " + esc(h); }).join("<br>") || "empty"; });
      def("open", "open <tab>", function (a) { var ok = ["terminal", "tools", "lab", "anime", "notes", "fun", "about"]; if (ok.indexOf(a) < 0) return "tabs: " + ok.join(", "); t.openTab(a); return "→ " + a; });
      def("goto", "goto <artist name>", function (a, raw) { if (!raw) return "usage: goto kanye"; var hs = document.querySelectorAll("#main h2"), q = raw.toLowerCase(); for (var i = 0; i < hs.length; i++) if (hs[i].textContent.toLowerCase().indexOf(q) >= 0) { hs[i].scrollIntoView({ behavior: "smooth", block: "center" }); return "→ " + esc(hs[i].textContent); } return "no artist matches “" + esc(raw) + "”"; });
      def("play", "play/pause the player", function () { var b = document.getElementById("floatingPlayPause"); if (b) b.click(); return "♪ toggled"; });
      def("pause", "play/pause the player", function () { return cmds.play(); });
      def("next", "next artist", function () { var b = document.getElementById("floatingNext"); if (b) b.click(); return "⏭"; });
      def("prev", "previous artist", function () { var b = document.getElementById("floatingPrevious"); if (b) b.click(); return "⏮"; });
      def("volume", "volume 0-100", function (a) { var n = num(a), v = document.getElementById("floatingVolume"); if (n === null || !v) return "usage: volume 60"; v.value = Math.max(0, Math.min(100, n)); v.dispatchEvent(new Event("input", { bubbles: true })); return "volume " + v.value; });
      def("top", "scroll to top", function () { scrollTo({ top: 0, behavior: "smooth" }); return "↑"; });
      def("bottom", "scroll to bottom", function () { scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); return "↓"; });
      def("fullscreen", "toggle fullscreen", function () { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} return "⛶"; });
      def("random", "random artist", function () { return "→ " + esc(pick(ARTISTS).name); });
      def("artists", "list artists", function () { return ARTISTS.map(function (a) { return esc(a.name); }).join(", "); });
      def("exit", "close panel", function () { API.close(); return null; });

      /* ----- UTILITIES ----- */
      cat = "utils";
      def("todo", "todo add|list|done <n>|clear", function (a, raw, args) {
        var l = store("eggTodos") || [], c = (args[0] || "list").toLowerCase();
        if (c === "add") { var tx = args.slice(1).join(" "); if (!tx) return "usage: todo add buy snacks"; l.push(tx); store("eggTodos", l); return "added (" + l.length + ")"; }
        if (c === "done") { var i = (num(args[1]) || 0) - 1; if (!l[i]) return "no such item"; var d = l.splice(i, 1); store("eggTodos", l); return "done: " + esc(d[0]); }
        if (c === "clear") { store("eggTodos", []); return "cleared"; }
        return l.length ? l.map(function (x, i) { return (i + 1) + ". " + esc(x); }).join("<br>") : "nothing to do 🎉";
      });
      def("note", "note <text> (adds to Notes tab)", function (a, raw) { if (!raw) return "usage: note remember this"; var old = ""; try { old = localStorage.getItem("eggNotes") || ""; localStorage.setItem("eggNotes", old + (old ? "\n" : "") + raw); } catch (e) { return "couldn't save"; } var ta = document.getElementById("eggNotes"); if (ta) ta.value = old + (old ? "\n" : "") + raw; return "saved to notes"; });
      def("timer", "timer <seconds>", function (a) { var n = num(a); if (n === null || n <= 0 || n > 3600) return "usage: timer 30 (1–3600s)"; setTimeout(function () { t.out("⏰ timer done (" + n + "s)", "egg-you"); API.confetti(); }, n * 1000); return "timer set for " + n + "s"; });
      def("countdown", "countdown <YYYY-MM-DD>", function (a) { var d = new Date(a); if (isNaN(d)) return "usage: countdown 2027-01-01"; var ms = d - new Date(); return ms < 0 ? "that date has passed" : Math.ceil(ms / 86400000) + " days to go"; });
      def("remind", "remind <seconds> <text>", function (a, raw, args) { var n = num(args[0]), tx = args.slice(1).join(" "); if (n === null || !tx || n > 3600) return "usage: remind 60 stretch"; setTimeout(function () { t.out("🔔 " + esc(tx), "egg-you"); }, n * 1000); return "i'll remind you in " + n + "s"; });
      def("coin", "flip a coin", function () { return pick(["heads", "tails"]); });
      def("dice", "roll dice (dice 2d6)", function (a) { var m = /^(\d+)d(\d+)$/.exec(a || "1d6"); if (!m) return "usage: dice 2d6"; var n = Math.min(20, +m[1]), s = Math.max(2, +m[2]), o = [], tot = 0; for (var i = 0; i < n; i++) { var r = 1 + rnd(s); o.push(r); tot += r; } return o.join(" + ") + " = " + tot; });
      def("pick", "pick a, b, c", function (a, raw) { var o = raw.split(",").map(function (x) { return x.trim(); }).filter(Boolean); return o.length ? "→ " + esc(pick(o)) : "usage: pick pizza, ramen, tacos"; });
      def("password", "password [length]", function (a) { var n = Math.max(6, Math.min(40, num(a) || 16)), cs = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*", s = ""; for (var i = 0; i < n; i++) s += cs[rnd(cs.length)]; copy(s); return esc(s) + "  (copied)"; });
      def("color", "random colour (+applies as accent)", function () { var c = "#" + rnd(16777215).toString(16).padStart(6, "0"); API.setAccent(c); return "<span style=\"color:" + c + "\">■</span> " + c; });

      /* ----- HELP (paginated, built last so it sees everything) ----- */
      cat = "system";
      def("help", "help [category]", function (a) {
        var names = Object.keys(CATS);
        if (a && CATS[a]) return "<b>" + a + "</b><br>" + CATS[a].map(function (n) { return "<span class=\"egg-cmd\">" + n + "</span> — " + esc(META[n] || ""); }).join("<br>");
        return "<b>" + Object.keys(cmds).length + " commands</b> in " + names.length + " categories. type <b>help &lt;category&gt;</b>:<br>" +
          names.map(function (n) { return "<span class=\"egg-cmd\">" + n + "</span> (" + CATS[n].length + ")"; }).join("  ") + "<br>tip: ↑/↓ recalls past commands.";
      });
    };

    /* ==========================================================
       LAB TAB — extra widgets
       ========================================================== */

    function buildLab(pane) {
      pane.innerHTML =
        '<div class="egg-grid">' +

          '<div class="egg-card"><span class="egg-h">divergence meter</span><b class="egg-nixie" id="labDiv">0.000000</b>' +
            '<div class="egg-row"><button data-lab="div">read worldline</button></div></div>' +

          '<div class="egg-card"><span class="egg-h">gacha pull</span><b class="egg-big egg-sm" id="labGacha">pull!</b>' +
            '<div class="egg-row"><button data-lab="gacha">pull ×1</button><button data-lab="gacha10">pull ×10</button></div><span class="egg-sub" id="labGachaSub"></span></div>' +

          '<div class="egg-card"><span class="egg-h">mood of the day</span>' +
            '<input type="range" min="1" max="10" value="7" id="labMood" class="egg-range"><b class="egg-big egg-sm" id="labMoodOut">7/10 🙂</b>' +
            '<div class="egg-bars" id="labMoodBars"></div></div>' +

          '<div class="egg-card"><span class="egg-h">palette</span><div class="egg-pal" id="labPal"></div>' +
            '<div class="egg-row"><button data-lab="pal">new palette</button></div><span class="egg-sub">click a swatch = copy hex + use as accent</span></div>' +

          '<div class="egg-card"><span class="egg-h">encoder</span>' +
            '<input class="egg-in" id="labEncIn" placeholder="type something…"><div class="egg-row">' +
            '<button data-enc="morse">morse</button><button data-enc="bin">binary</button><button data-enc="b64">base64</button><button data-enc="rot">rot13</button></div>' +
            '<div class="egg-out" id="labEncOut">—</div></div>' +

          '<div class="egg-card"><span class="egg-h">typing test</span><div class="egg-out" id="labTypeText">click start</div>' +
            '<input class="egg-in" id="labTypeIn" placeholder="type here…" disabled><div class="egg-row"><button data-lab="type">start</button><b id="labTypeRes" class="egg-sub"></b></div></div>' +

          '<div class="egg-card"><span class="egg-h">habits</span><div id="labHabits"></div>' +
            '<div class="egg-row"><input class="egg-in egg-in-sm" id="labHabitIn" placeholder="new habit"><button data-lab="habit">add</button></div></div>' +

          '<div class="egg-card"><span class="egg-h">countdown</span>' +
            '<input type="date" class="egg-in" id="labCdDate"><b class="egg-big egg-sm" id="labCdOut">pick a date</b>' +
            '<input class="egg-in egg-in-sm" id="labCdName" placeholder="what is it?"></div>' +

          '<div class="egg-card"><span class="egg-h">kaomoji</span><div class="egg-kao" id="labKao">' +
            KAOMOJI.map(function (k) { return '<button data-kao="' + esc(k) + '">' + esc(k) + '</button>'; }).join("") + '</div><span class="egg-sub">click to copy</span></div>' +

        '</div>';

      var $ = function (id) { return document.getElementById(id); };

      $("labDiv").textContent = divergence();
      /* gacha */
      var pulls = store("eggPulls") || 0, pool = [];
      ["nisekoi", "oregairu"].forEach(function (k) { ((AN[k] || {}).characters || []).forEach(function (c) { pool.push(c.name); }); });
      if (!pool.length) pool = NAMES;
      function pull() { var r = Math.random(), s = r < .03 ? 5 : r < .15 ? 4 : 3; pulls++; store("eggPulls", pulls); return { s: s, n: pick(pool) }; }
      /* mood */
      var moods = store("eggMood") || {}, today = new Date().toISOString().slice(0, 10);
      function paintMood() {
        var keys = Object.keys(moods).sort().slice(-14);
        $("labMoodBars").innerHTML = keys.map(function (k) { return '<i title="' + k + ': ' + moods[k] + '/10" style="height:' + (moods[k] * 10) + '%"></i>'; }).join("");
        var v = moods[today] || +$("labMood").value; $("labMood").value = v;
        $("labMoodOut").textContent = v + "/10 " + ["😭", "😞", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥳"][v - 1];
      }
      $("labMood").addEventListener("input", function () { moods[today] = +this.value; store("eggMood", moods); paintMood(); });
      paintMood();
      /* palette */
      function palette() {
        var h = rnd(360), o = [];
        for (var i = 0; i < 5; i++) o.push("hsl(" + ((h + i * 32) % 360) + "," + (55 + rnd(30)) + "%," + (45 + rnd(25)) + "%)");
        $("labPal").innerHTML = o.map(function (c) { return '<button class="egg-sw" style="background:' + c + '" data-c="' + c + '" aria-label="' + c + '"></button>'; }).join("");
      }
      palette();
      /* habits */
      function habits() { return store("eggHabits") || []; }
      function paintHabits() {
        var l = habits();
        $("labHabits").innerHTML = l.length ? l.map(function (h, i) {
          var done = h.days.indexOf(today) >= 0;
          return '<div class="egg-habit"><button data-hab="' + i + '" class="' + (done ? 'is-done' : '') + '">' + (done ? '✓' : '○') + '</button><span>' + esc(h.name) + '</span><small>' + h.days.length + ' days</small></div>';
        }).join("") : '<span class="egg-sub">no habits yet</span>';
      }
      paintHabits();
      /* countdown */
      function paintCd() {
        var d = store("eggCd") || {}; if (d.date) $("labCdDate").value = d.date; if (d.name) $("labCdName").value = d.name;
        if (!d.date) return;
        var ms = new Date(d.date) - new Date();
        $("labCdOut").textContent = (d.name ? d.name + ": " : "") + (ms < 0 ? "passed" : Math.ceil(ms / 86400000) + " days");
      }
      paintCd();
      $("labCdDate").addEventListener("change", function () { store("eggCd", { date: this.value, name: $("labCdName").value }); paintCd(); });
      $("labCdName").addEventListener("input", function () { store("eggCd", { date: $("labCdDate").value, name: this.value }); paintCd(); });
      /* typing test */
      var sentences = ["the quick brown fox jumps over the lazy dog", "the choice of steins gate was made", "youth is a lie but tea is real", "a locket and a key and a promise", "senpai please notice my high score"], target = "", t0 = 0;
      $("labTypeIn").addEventListener("keydown", function (e) { e.stopPropagation(); });
      $("labTypeIn").addEventListener("input", function () {
        if (!t0) t0 = Date.now();
        if (this.value === target) { var m = (Date.now() - t0) / 60000; $("labTypeRes").textContent = Math.round(target.split(" ").length / m) + " WPM 🎉"; this.disabled = true; t0 = 0; }
      });
      /* encoder */
      $("labEncIn").addEventListener("keydown", function (e) { e.stopPropagation(); });
      $("labHabitIn").addEventListener("keydown", function (e) { e.stopPropagation(); });
      $("labCdName").addEventListener("keydown", function (e) { e.stopPropagation(); });

      pane.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var a = b.getAttribute("data-lab");
        if (a === "div") { var n = 0, id = setInterval(function () { $("labDiv").textContent = divergence(); if (++n > 10) clearInterval(id); }, 50); }
        if (a === "gacha") { var r = pull(); $("labGacha").textContent = "★".repeat(r.s) + "  " + r.n; $("labGachaSub").textContent = pulls + " total pulls"; if (r.s === 5) window.EGG_API.confetti(); }
        if (a === "gacha10") { var best = { s: 0, n: "" }; for (var i = 0; i < 10; i++) { var x = pull(); if (x.s > best.s) best = x; } $("labGacha").textContent = "best of 10: " + "★".repeat(best.s) + " " + best.n; $("labGachaSub").textContent = pulls + " total pulls"; if (best.s === 5) window.EGG_API.confetti(); }
        if (a === "pal") palette();
        if (a === "type") { target = pick(sentences); t0 = 0; $("labTypeText").textContent = target; $("labTypeRes").textContent = ""; var ti = $("labTypeIn"); ti.value = ""; ti.disabled = false; ti.focus(); }
        if (a === "habit") { var nm = $("labHabitIn").value.trim(); if (nm) { var l = habits(); l.push({ name: nm, days: [] }); store("eggHabits", l); $("labHabitIn").value = ""; paintHabits(); } }
        var hi = b.getAttribute("data-hab");
        if (hi !== null) { var l2 = habits(), h = l2[+hi], k = h.days.indexOf(today); if (k >= 0) h.days.splice(k, 1); else h.days.push(today); store("eggHabits", l2); paintHabits(); }
        var c = b.getAttribute("data-c"); if (c) { window.EGG_API.setAccent(c); copy(c); }
        var enc = b.getAttribute("data-enc");
        if (enc) { var v = $("labEncIn").value; $("labEncOut").textContent = enc === "morse" ? toMorse(v) : enc === "bin" ? toBin(v) : enc === "b64" ? b64(v) : rot13(v); }
        var ka = b.getAttribute("data-kao"); if (ka) { copy(ka); b.classList.add("is-copied"); setTimeout(function () { b.classList.remove("is-copied"); }, 600); }
      });
    }

    /* ==========================================================
       ANIME TAB — moments, diary, favourites, specials + 3 themed pages
       ========================================================== */

    function buildAnime(pane, t) {
      var subs = [["moments", "moments"], ["diary", "diary"], ["favourites", "favourites"], ["specials", "specials"], ["nisekoi", "♡ nisekoi"], ["oregairu", "☕ oregairu"], ["steinsgate", "⌁ steins;gate"]];
      pane.innerHTML = '<div class="hub-subs">' + subs.map(function (s, i) { return '<button type="button" data-hub="' + s[0] + '" class="' + (i === 0 ? "is-on" : "") + '">' + s[1] + '</button>'; }).join("") + '</div><div class="hub" id="hubBody"></div>';
      var body = pane.querySelector("#hubBody");

      function img(u) { return u ? '<img class="hub-img" loading="lazy" referrerpolicy="no-referrer" src="' + esc(u) + '" alt="">' : ""; }
      function momentsList(list) { return (list || []).length ? list.map(function (m) { return '<article class="hub-card">' + img(m.img) + '<div><span class="hub-tag">' + esc(m.anime || m.tag || "") + (m.tag && m.anime ? " · " + esc(m.tag) : "") + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.text) + '</p></div></article>'; }).join("") : '<p class="egg-sub">nothing here yet — add entries in content.js</p>'; }
      function chars(list) { return '<div class="hub-chars">' + (list || []).map(function (c) { return '<div class="hub-char"><b>' + esc(c.name) + '</b><span>' + esc(c.note) + '</span></div>'; }).join("") + '</div>'; }
      function vibes(list) { return '<div class="hub-vibes">' + (list || []).map(function (v) { return '<span>' + esc(v) + '</span>'; }).join("") + '</div>'; }

      var R = {
        moments: function () { return '<h3 class="hub-h">anime moments</h3>' + momentsList(AN.moments); },
        diary: function () { var d = AN.diary || []; return '<h3 class="hub-h">diary</h3>' + (d.length ? d.map(function (e) { return '<article class="hub-card hub-diary"><div><span class="hub-tag">' + esc(e.date) + ' ' + esc(e.mood || "") + '</span><h3>' + esc(e.title) + '</h3><p>' + esc(e.text).replace(/\n/g, "<br>") + '</p></div></article>'; }).join("") : '<p class="egg-sub">no entries yet</p>'); },
        favourites: function () { var f = AN.favourites || []; return '<h3 class="hub-h">favourites</h3><div class="hub-fav">' + f.map(function (x, i) { return '<div class="hub-fav-row"><span class="hub-rank">' + String(i + 1).padStart(2, "0") + '</span><div><b>' + esc(x.title) + '</b><small>' + esc(x.note || "") + '</small></div><span class="hub-status">' + esc(x.status || "") + '</span><span class="hub-score">' + (x.rating ? esc(x.rating) + "/10" : "—") + '</span></div>'; }).join("") + '</div>'; },
        specials: function () { var s = AN.specials || []; return '<h3 class="hub-h">my specials</h3>' + s.map(function (x) { return '<article class="hub-card hub-special"><div><span class="hub-tag">★ special</span><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div></article>'; }).join(""); },

        nisekoi: function () {
          var N = AN.nisekoi || {};
          return '<div class="hub-theme" data-hub-theme="nisekoi"><h3 class="hub-h">♡ nisekoi</h3><p class="hub-tag-line">' + esc(N.tagline) + '</p>' + vibes(N.vibes) +
            '<h4>the cast</h4>' + chars(N.characters) +
            '<div class="hub-widget"><span class="egg-h">who would you end up with?</span><b class="egg-big egg-sm" id="nkOut">press the key…</b><div class="egg-row"><button data-nk="go">turn the key 🗝️</button></div></div>' +
            '<h4>moments</h4>' + momentsList(N.moments) + '</div>';
        },
        oregairu: function () {
          var O = AN.oregairu || {};
          return '<div class="hub-theme" data-hub-theme="oregairu"><h3 class="hub-h">☕ oregairu</h3><p class="hub-tag-line">' + esc(O.tagline) + '</p>' + vibes(O.vibes) +
            '<h4>the club</h4>' + chars(O.characters) +
            '<div class="hub-widget"><span class="egg-h">service club request box</span><input class="egg-in" id="orIn" placeholder="what\'s your problem?"><div class="egg-row"><button data-or="go">submit request</button></div><div class="egg-out" id="orOut">—</div></div>' +
            '<h4>moments</h4>' + momentsList(O.moments) + '</div>';
        },
        steinsgate: function () {
          var S = AN.steinsgate || {};
          return '<div class="hub-theme" data-hub-theme="steinsgate"><h3 class="hub-h">⌁ steins;gate</h3><p class="hub-tag-line">' + esc(S.tagline) + '</p>' + vibes(S.vibes) +
            '<div class="hub-widget"><span class="egg-h">divergence meter</span><b class="egg-nixie egg-nixie-big" id="sgDiv">1.048596</b><div class="egg-row"><button data-sg="div">shift worldline</button></div></div>' +
            '<div class="hub-widget"><span class="egg-h">send a D-Mail</span><input class="egg-in" id="sgIn" placeholder="message to the past…"><div class="egg-row"><button data-sg="mail">SEND</button></div><div class="egg-out" id="sgOut">—</div></div>' +
            '<h4>moments</h4>' + momentsList(S.moments) + '</div>';
        }
      };

      function show(k) {
        body.innerHTML = R[k]();
        body.setAttribute("data-hub", k);
        Array.prototype.forEach.call(pane.querySelectorAll("[data-hub]"), function (b) { if (b.tagName === "BUTTON") b.classList.toggle("is-on", b.getAttribute("data-hub") === k); });
      }
      show("moments");

      var $ = function (id) { return document.getElementById(id); };
      ["orIn", "sgIn"].forEach(function () {});
      pane.addEventListener("keydown", function (e) { if (e.target.tagName === "INPUT") e.stopPropagation(); });
      pane.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var h = b.getAttribute("data-hub"); if (h) { show(h); return; }
        if (b.getAttribute("data-nk")) {
          var cs = (AN.nisekoi || {}).characters || [], out = $("nkOut"), n = 0;
          var id = setInterval(function () { out.textContent = cs.length ? pick(cs).name : "…"; if (++n > 10) { clearInterval(id); out.textContent = "♡ " + (cs.length ? pick(cs).name : "?") + " ♡"; window.EGG_API.confetti(); } }, 70);
        }
        if (b.getAttribute("data-or")) { var q = $("orIn").value.trim(); $("orOut").textContent = (q ? "“" + q + "” → " : "") + pick((AN.oregairu || {}).requests || ["request noted."]); }
        if (b.getAttribute("data-sg") === "div") { var o = $("sgDiv"), n2 = 0, id2 = setInterval(function () { o.textContent = divergence().replace(/^0/, String(rnd(2))); if (++n2 > 12) clearInterval(id2); }, 60); }
        if (b.getAttribute("data-sg") === "mail") { var m = $("sgIn").value.trim(); if (!m) { $("sgOut").textContent = "write something first."; return; } $("sgOut").innerHTML = "D-Mail sent: “" + esc(m) + "”<br>" + esc(pick((AN.steinsgate || {}).dmailReplies || ["sent."])) + "<br>new divergence: " + divergence(); $("sgDiv") && ($("sgDiv").textContent = divergence()); }
      });

      t.openAnime = function (k) { if (R[k]) show(k); };
    }

    window.EGG_EXT = function (win, t) {
      buildLab(win.querySelector('[data-pane="lab"]'));
      buildAnime(win.querySelector('[data-pane="anime"]'), t);
    };

  })();

  /* ==========================================================
     HIDDEN EASTER EGG — secret control panel
     Open it with: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A),
     or tap the big hero title 5 times quickly (phones).
     ========================================================== */

  (function initSecretPanel() {

    var $ = function (s, r) { return (r || document).querySelector(s); };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function setAccent(c) { document.documentElement.style.setProperty("--accent", c); try { localStorage.setItem("siteAccent", c); } catch (e) {} }

    var win = null;
    var API = window.EGG_API = { pick: pick, esc: esc, setAccent: setAccent, toggleMatrix: toggleMatrix, confetti: confetti, close: function () { closeWin(); },
      openTab: function (n) { if (!win) return; var b = win.querySelector('.egg-tab[data-tab="' + n + '"]'); if (b) b.click(); } };

    /* ---------- effects: matrix rain + confetti ---------- */
    var matrixCv = null, matrixRaf = 0;
    function toggleMatrix() {
      if (matrixCv) { cancelAnimationFrame(matrixRaf); matrixCv.remove(); matrixCv = null; return false; }
      matrixCv = document.createElement("canvas");
      matrixCv.className = "egg-fx";
      document.body.appendChild(matrixCv);
      var ctx = matrixCv.getContext("2d"), cols, drops;
      function size() {
        matrixCv.width = innerWidth; matrixCv.height = innerHeight;
        cols = Math.ceil(innerWidth / 16); drops = new Array(cols).fill(0).map(function () { return Math.random() * -50; });
      }
      size();
      var chars = "01アイウエオカキクケコサシスセソ<>/\\{}$#";
      (function draw() {
        ctx.fillStyle = "rgba(8,8,8,.12)"; ctx.fillRect(0, 0, matrixCv.width, matrixCv.height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7cf5c4";
        ctx.font = "15px 'Space Mono', monospace";
        for (var i = 0; i < cols; i++) {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, drops[i] * 16);
          if (drops[i] * 16 > matrixCv.height && Math.random() > .975) drops[i] = 0;
          drops[i]++;
        }
        matrixRaf = requestAnimationFrame(draw);
      })();
      return true;
    }

    function confetti() {
      var cv = document.createElement("canvas");
      cv.className = "egg-fx egg-fx-top";
      cv.width = innerWidth; cv.height = innerHeight;
      document.body.appendChild(cv);
      var ctx = cv.getContext("2d"), cols = ["#eee7d8", "#ff4f9a", "#7cf5c4", "#6ea8ff", "#ffb347", "#c792ff"];
      var ps = []; for (var i = 0; i < 160; i++) ps.push({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 18, vy: Math.random() * -16 - 4, s: 4 + Math.random() * 6, c: pick(cols), r: Math.random() * 6 });
      var t = 0;
      (function f() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ps.forEach(function (p) { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); });
        if (++t < 140) requestAnimationFrame(f); else cv.remove();
      })();
    }

    /* ---------- the window ---------- */
    function build() {
      win = document.createElement("div");
      win.className = "egg-window";
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-label", "Secret control panel");
      win.innerHTML =
        '<div class="egg-titlebar"><strong>SECRET.EXE</strong><small>you found it</small>' +
          '<button type="button" class="egg-x" aria-label="Close">×</button></div>' +
        '<div class="egg-tabs" role="tablist">' +
          ['terminal', 'tools', 'lab', 'anime', 'notes', 'fun', 'about'].map(function (t, i) {
            return '<button type="button" role="tab" class="egg-tab' + (i === 0 ? ' is-on' : '') + '" data-tab="' + t + '">' + t + '</button>';
          }).join('') + '</div>' +
        '<div class="egg-body">' +

          /* terminal */
          '<section class="egg-pane is-on" data-pane="terminal">' +
            '<div class="egg-term" id="eggTerm"></div>' +
            '<div class="egg-term-row"><span>&gt;</span><input id="eggCmd" type="text" autocomplete="off" spellcheck="false" placeholder="type help"></div>' +
          '</section>' +

          /* tools */
          '<section class="egg-pane" data-pane="tools">' +
            '<div class="egg-grid">' +
              '<div class="egg-card"><span class="egg-h">pomodoro</span><b class="egg-big" id="pomoTime">25:00</b>' +
                '<div class="egg-row"><button data-pomo="start">start</button><button data-pomo="pause">pause</button><button data-pomo="reset">reset</button></div>' +
                '<div class="egg-row"><button data-pomo-len="25">25</button><button data-pomo-len="5">5</button><button data-pomo-len="50">50</button></div></div>' +
              '<div class="egg-card"><span class="egg-h">stopwatch</span><b class="egg-big" id="swTime">00:00.0</b>' +
                '<div class="egg-row"><button data-sw="go">start / stop</button><button data-sw="lap">lap</button><button data-sw="reset">reset</button></div>' +
                '<div class="egg-laps" id="swLaps"></div></div>' +
              '<div class="egg-card"><span class="egg-h">calculator</span><div class="egg-calc-out" id="calcOut">0</div>' +
                '<div class="egg-calc">' +
                  ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','(',')','⌫','C'].map(function (k) { return '<button data-k="' + k + '">' + k + '</button>'; }).join('') +
                '</div></div>' +
              '<div class="egg-card"><span class="egg-h">decisions</span><b class="egg-big egg-sm" id="coinOut">flip or pick</b>' +
                '<div class="egg-row"><button data-coin="flip">coin</button><button data-coin="num">1–100</button><button data-coin="artist">artist</button><button data-coin="color">colour</button></div></div>' +
            '</div></section>' +

          '<section class="egg-pane" data-pane="lab"></section>' +
          '<section class="egg-pane" data-pane="anime"></section>' +

          /* notes */
          '<section class="egg-pane" data-pane="notes">' +
            '<textarea id="eggNotes" class="egg-notes" placeholder="a scratchpad that remembers (saved in this browser only)"></textarea>' +
            '<span class="egg-sub" id="eggNotesState">saved</span></section>' +

          /* fun */
          '<section class="egg-pane" data-pane="fun">' +
            '<div class="egg-fun">' +
              '<button data-fun="matrix">matrix rain</button><button data-fun="confetti">confetti</button>' +
              '<button data-fun="invert">invert colours</button><button data-fun="mirror">mirror site</button>' +
              '<button data-fun="spin">spin the page</button><button data-fun="shake">earthquake</button>' +
              '<button data-fun="rainbow">rainbow accent</button><button data-fun="reset">reset everything</button>' +
            '</div><div class="egg-sub">each button toggles or fires once. reset puts the site back.</div>' +
            '<canvas id="eggPad" class="egg-pad" width="420" height="180" aria-label="Drawing pad"></canvas>' +
            '<div class="egg-row"><span class="egg-sub">draw here ↑</span><button data-fun="clearpad">clear pad</button></div></section>' +

          /* about */
          '<section class="egg-pane" data-pane="about">' +
            '<p class="egg-p">you found the secret panel. 🎉</p>' +
            '<p class="egg-p">open it again any time with the <b>Konami code</b> (↑ ↑ ↓ ↓ ← → ← → B A), or tap the hero title 5 times on a phone.</p>' +
            '<p class="egg-p">in the terminal try: <code>help</code>, <code>matrix</code>, <code>accent hotpink</code>, <code>artists</code>, <code>secret</code>.</p>' +
            '<p class="egg-p egg-sub" id="eggStats"></p></section>' +
        '</div>' +
        '<span class="egg-grip" aria-hidden="true"></span>';
      document.body.appendChild(win);

      wireTabs(); wireTerminal(); wireTools(); wireNotes(); wireFun(); wireDrag();
      if (window.EGG_EXT) window.EGG_EXT(win, API);
      $("#eggStats", win).textContent = ARTISTS.length + " artists · " + PLAYLISTS.length + " playlists · built with way too much love";
    }

    function wireTabs() {
      win.addEventListener("click", function (e) {
        var t = e.target.closest(".egg-tab");
        if (!t) return;
        var name = t.getAttribute("data-tab");
        Array.prototype.forEach.call(win.querySelectorAll(".egg-tab"), function (b) { b.classList.toggle("is-on", b === t); });
        Array.prototype.forEach.call(win.querySelectorAll(".egg-pane"), function (p) { p.classList.toggle("is-on", p.getAttribute("data-pane") === name); });
        if (name === "terminal") $("#eggCmd", win).focus();
      });
      $(".egg-x", win).addEventListener("click", closeWin);
    }

    /* ---------- terminal ---------- */
    function wireTerminal() {
      var term = $("#eggTerm", win), input = $("#eggCmd", win), hist = [], hi = 0;
      function out(t, cls) { var d = document.createElement("div"); d.className = cls || ""; d.innerHTML = t; term.appendChild(d); term.scrollTop = term.scrollHeight; }
      out("welcome to <b>secret.exe</b>. type <b>help</b>.", "egg-dim");
      var colors = { hotpink: "#ff4f9a", mint: "#7cf5c4", sky: "#6ea8ff", amber: "#ffb347", violet: "#c792ff", cream: "#eee7d8", red: "#ff5c5c", lime: "#b6ff5c" };
      var cmds = {
        help: function () { return "commands: help, artists, random, time, whoami, accent &lt;name|#hex&gt;, colors, matrix, confetti, flip, roll, echo &lt;text&gt;, history, clear, secret, exit"; },
        artists: function () { return ARTISTS.map(function (a) { return esc(a.name); }).join(", ") || "none"; },
        random: function () { return "→ " + esc(pick(ARTISTS).name); },
        time: function () { return new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) + " (Dhaka)"; },
        whoami: function () { return "a curious visitor with excellent taste in secret panels."; },
        colors: function () { return Object.keys(colors).join(", "); },
        accent: function (a) { var c = colors[a] || (/^#[0-9a-f]{3,8}$/i.test(a || "") ? a : ""); if (!c) return "usage: accent hotpink | accent #ff00aa"; setAccent(c); return "accent → " + c; },
        matrix: function () { return toggleMatrix() ? "wake up..." : "matrix off."; },
        confetti: function () { confetti(); return "🎉"; },
        flip: function () { return pick(["heads", "tails"]); },
        roll: function () { return "🎲 " + (1 + Math.floor(Math.random() * 6)); },
        echo: function (a, raw) { return esc(raw); },
        history: function () { return hist.map(function (h, i) { return (i + 1) + "  " + esc(h); }).join("<br>") || "empty"; },
        clear: function () { term.innerHTML = ""; return null; },
        secret: function () { return pick(["the real easter egg was the friends we made along the way.", "EL PSY KONGROO.", "there is a second secret. keep looking.", "sudo make me a sandwich."]); },
        exit: function () { closeWin(); return null; }
      };
      API.out = out; API.term = term; API.hist = hist; API.input = input;
      if (window.EGG_CMDS) window.EGG_CMDS(cmds, API);
      input.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.key === "ArrowUp") { if (hist.length) { hi = Math.max(0, hi - 1); input.value = hist[hi] || ""; } e.preventDefault(); return; }
        if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; e.preventDefault(); return; }
        if (e.key !== "Enter") return;
        var line = input.value.trim(); input.value = "";
        if (!line) return;
        hist.push(line); hi = hist.length;
        out("&gt; " + esc(line), "egg-you");
        var parts = line.split(/\s+/), name = parts[0].toLowerCase(), rest = line.slice(parts[0].length).trim();
        var fn = cmds[name];
        if (!fn) { out("unknown command: " + esc(name) + " (try help)", "egg-err"); return; }
        var r;
        try { r = fn(parts[1] && parts[1].toLowerCase(), rest, parts.slice(1)); } catch (err) { r = "error: " + esc(err.message); }
        if (r) out(r);
      });
      setTimeout(function () { input.focus(); }, 50);
    }

    /* ---------- tools ---------- */
    function wireTools() {
      /* pomodoro */
      var pomoLen = 25 * 60, pomoLeft = pomoLen, pomoT = null, pt = $("#pomoTime", win);
      function paintPomo() { pt.textContent = String(Math.floor(pomoLeft / 60)).padStart(2, "0") + ":" + String(pomoLeft % 60).padStart(2, "0"); }
      win.querySelectorAll("[data-pomo]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-pomo");
          if (a === "start" && !pomoT) pomoT = setInterval(function () { if (--pomoLeft <= 0) { clearInterval(pomoT); pomoT = null; pomoLeft = 0; confetti(); } paintPomo(); }, 1000);
          if (a === "pause") { clearInterval(pomoT); pomoT = null; }
          if (a === "reset") { clearInterval(pomoT); pomoT = null; pomoLeft = pomoLen; }
          paintPomo();
        });
      });
      win.querySelectorAll("[data-pomo-len]").forEach(function (b) {
        b.addEventListener("click", function () { clearInterval(pomoT); pomoT = null; pomoLen = +b.getAttribute("data-pomo-len") * 60; pomoLeft = pomoLen; paintPomo(); });
      });

      /* stopwatch */
      var swStart = 0, swAcc = 0, swT = null, st = $("#swTime", win), laps = $("#swLaps", win);
      function swNow() { return swAcc + (swT ? Date.now() - swStart : 0); }
      function fmt(ms) { var s = ms / 1000; return String(Math.floor(s / 60)).padStart(2, "0") + ":" + (s % 60).toFixed(1).padStart(4, "0"); }
      win.querySelectorAll("[data-sw]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-sw");
          if (a === "go") { if (swT) { swAcc = swNow(); clearInterval(swT); swT = null; } else { swStart = Date.now(); swT = setInterval(function () { st.textContent = fmt(swNow()); }, 100); } }
          if (a === "lap" && (swT || swAcc)) { var d = document.createElement("div"); d.textContent = "lap " + (laps.children.length + 1) + "  " + fmt(swNow()); laps.prepend(d); }
          if (a === "reset") { clearInterval(swT); swT = null; swAcc = 0; st.textContent = "00:00.0"; laps.innerHTML = ""; }
        });
      });

      /* calculator (whitelisted characters only) */
      var expr = "", co = $("#calcOut", win);
      win.querySelectorAll("[data-k]").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-k");
          if (k === "C") expr = "";
          else if (k === "⌫") expr = expr.slice(0, -1);
          else if (k === "=") { try { if (/^[0-9+\-*/.() ]+$/.test(expr)) { var v = Function('"use strict";return (' + expr + ")")(); expr = isFinite(v) ? String(+v.toFixed(8)) : "error"; } } catch (e) { expr = "error"; } }
          else { if (expr === "error") expr = ""; expr += k; }
          co.textContent = expr || "0";
        });
      });

      /* decisions */
      var cout = $("#coinOut", win);
      win.querySelectorAll("[data-coin]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-coin");
          if (a === "flip") cout.textContent = pick(["heads", "tails"]);
          if (a === "num") cout.textContent = String(1 + Math.floor(Math.random() * 100));
          if (a === "artist") cout.textContent = pick(ARTISTS).name;
          if (a === "color") { var c = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"); cout.textContent = c; cout.style.color = c; }
          else cout.style.color = "";
        });
      });
    }

    /* ---------- notes (localStorage, wrapped) ---------- */
    function wireNotes() {
      var ta = $("#eggNotes", win), state = $("#eggNotesState", win), t = null;
      try { ta.value = localStorage.getItem("eggNotes") || ""; } catch (e) {}
      ta.addEventListener("keydown", function (e) { e.stopPropagation(); });
      ta.addEventListener("input", function () {
        state.textContent = "saving…"; clearTimeout(t);
        t = setTimeout(function () { try { localStorage.setItem("eggNotes", ta.value); state.textContent = "saved"; } catch (e) { state.textContent = "couldn't save here"; } }, 400);
      });
    }

    /* ---------- fun ---------- */
    function wireFun() {
      var root = document.documentElement, rainbowT = null;
      var pad = $("#eggPad", win), pc = pad.getContext("2d"), drawing = false;
      pc.lineWidth = 3; pc.lineCap = "round";
      function pp(e) { var r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; }
      pad.addEventListener("pointerdown", function (e) { drawing = true; pad.setPointerCapture(e.pointerId); var p = pp(e); pc.beginPath(); pc.moveTo(p[0], p[1]); pc.strokeStyle = getComputedStyle(root).getPropertyValue("--accent").trim() || "#eee7d8"; });
      pad.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pp(e); pc.lineTo(p[0], p[1]); pc.stroke(); });
      pad.addEventListener("pointerup", function () { drawing = false; });

      function undo() { root.classList.remove("egg-invert", "egg-mirror", "egg-spin", "egg-shake"); clearInterval(rainbowT); rainbowT = null; if (matrixCv) toggleMatrix(); }
      win.querySelectorAll("[data-fun]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-fun");
          if (a === "matrix") toggleMatrix();
          if (a === "confetti") confetti();
          if (a === "invert") root.classList.toggle("egg-invert");
          if (a === "mirror") root.classList.toggle("egg-mirror");
          if (a === "spin") { root.classList.add("egg-spin"); setTimeout(function () { root.classList.remove("egg-spin"); }, 1300); }
          if (a === "shake") { root.classList.add("egg-shake"); setTimeout(function () { root.classList.remove("egg-shake"); }, 900); }
          if (a === "rainbow") { if (rainbowT) { clearInterval(rainbowT); rainbowT = null; } else { var h = 0; rainbowT = setInterval(function () { h = (h + 6) % 360; root.style.setProperty("--accent", "hsl(" + h + ",90%,65%)"); }, 80); } }
          if (a === "clearpad") pc.clearRect(0, 0, pad.width, pad.height);
          if (a === "reset") { undo(); var s = "#eee7d8"; try { s = localStorage.getItem("siteAccent") || s; } catch (e) {} root.style.setProperty("--accent", s); }
        });
      });
    }

    /* ---------- drag + open/close ---------- */
    function wireDrag() {
      var bar = $(".egg-titlebar", win), d = null;
      bar.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button") || innerWidth < 700) return;
        var r = win.getBoundingClientRect();
        d = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        bar.setPointerCapture(e.pointerId);
      });
      bar.addEventListener("pointermove", function (e) {
        if (!d) return;
        win.style.left = Math.max(0, Math.min(innerWidth - 80, e.clientX - d.dx)) + "px";
        win.style.top = Math.max(0, Math.min(innerHeight - 40, e.clientY - d.dy)) + "px";
        win.style.transform = "none";
      });
      bar.addEventListener("pointerup", function () { d = null; });
    }

    function openWin() {
      if (!win) build();
      win.classList.add("is-open");
      var inp = $("#eggCmd", win); if (inp) setTimeout(function () { inp.focus(); }, 60);
      confetti();
    }
    function closeWin() { if (win) win.classList.remove("is-open"); }
    function toggleWin() { if (win && win.classList.contains("is-open")) closeWin(); else openWin(); }

    /* ---------- the secret triggers ---------- */
    var code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"], pos = 0;
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeWin(); return; }
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === code[pos]) ? pos + 1 : (k === code[0] ? 1 : 0);
      if (pos === code.length) { pos = 0; toggleWin(); }
    });

    var title = document.getElementById("heroTitle"), taps = 0, tapT = null;
    if (title) title.addEventListener("click", function () {
      taps++; clearTimeout(tapT); tapT = setTimeout(function () { taps = 0; }, 1500);
      if (taps >= 5) { taps = 0; toggleWin(); }
    });

    try { console.log("%cpsst… ↑ ↑ ↓ ↓ ← → ← → B A", "color:#ff4f9a;font:700 14px monospace"); } catch (e) {}
  })();

  /* ==========================================================
     STATS STRIP WIDGET
     ========================================================== */

  (function initStatsStrip() {

    var el = document.getElementById("statsStrip");
    if (!el) return;

    var imageCount = ARTISTS.reduce(function (sum, a) {
      if (a.groups) {
        return sum + a.groups.reduce(function (s, g) { return s + (g.images ? g.images.length : 0); }, 0);
      }
      return sum + (a.images ? a.images.length : 0);
    }, 0);

    el.innerHTML =
      '<span class="stat"><b>' + ARTISTS.length + '</b> artists</span>' +
      '<span class="stat"><b>' + imageCount + '+</b> photos</span>' +
      '<span class="stat"><b>' + PLAYLISTS.length + '</b> playlists</span>';

  })();


  /* ==========================================================
     MOBILE NAV DRAWER
     ========================================================== */

  (function initNavDrawer() {

    var trigger = document.getElementById("navTrigger");
    var backdrop = document.getElementById("navBackdrop");
    var nav = document.getElementById("nav");
    if (!trigger || !nav) return;

    function closeDrawer() {
      nav.classList.remove("nav-open");
      if (backdrop) backdrop.classList.remove("nav-backdrop-on");
      trigger.classList.remove("nav-trigger-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function openDrawer() {
      nav.classList.add("nav-open");
      if (backdrop) backdrop.classList.add("nav-backdrop-on");
      trigger.classList.add("nav-trigger-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    trigger.addEventListener("click", function () {
      if (nav.classList.contains("nav-open")) closeDrawer(); else openDrawer();
    });

    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") closeDrawer(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  })();


  /* ==========================================================
     SEARCH
     ========================================================== */

  (function initSearch() {

    var trigger = document.getElementById("searchTrigger");
    var overlay = document.getElementById("searchOverlay");
    var input = document.getElementById("searchInput");
    var closeBtn = document.getElementById("searchClose");
    var resultsEl = document.getElementById("searchResults");

    if (!trigger || !overlay || !input || !resultsEl) return;

    function renderResults(query) {

      var q = query.trim().toLowerCase();
      var matches = !q ? ARTISTS : ARTISTS.filter(function (a) {
        return a.name.toLowerCase().indexOf(q) !== -1;
      });

      if (!matches.length) {
        resultsEl.innerHTML = '<li class="search-empty">no artists match "' + escapeHTML(query) + '"</li>';
        return;
      }

      resultsEl.innerHTML = matches.map(function (a) {
        return '<li><a href="#' + escapeHTML(a.id) + '">' + escapeHTML(a.name) + '</a></li>';
      }).join("");

    }

    function openSearch() {
      overlay.classList.add("search-open");
      overlay.setAttribute("aria-hidden", "false");
      renderResults("");
      input.value = "";
      setTimeout(function () { input.focus(); }, 50);
    }

    function closeSearch() {
      overlay.classList.remove("search-open");
      overlay.setAttribute("aria-hidden", "true");
    }

    trigger.addEventListener("click", openSearch);
    closeBtn.addEventListener("click", closeSearch);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeSearch();
    });

    resultsEl.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeSearch();
    });

    input.addEventListener("input", function () { renderResults(input.value); });

    document.addEventListener("keydown", function (e) {
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
          document.activeElement !== input) {
        var tag = document.activeElement && document.activeElement.tagName
          ? document.activeElement.tagName.toLowerCase() : "";
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          openSearch();
        }
      } else if (e.key === "Escape" && overlay.classList.contains("search-open")) {
        closeSearch();
      }
    });

  })();


  /* ==========================================================
     SURPRISE ME — jump to a random artist
     ========================================================== */

  (function initSurprise() {

    var btn = document.getElementById("surpriseBtn");
    if (!btn || !ARTISTS.length) return;

    btn.addEventListener("click", function () {
      var pick = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
      var target = document.getElementById(pick.id);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

  })();


  /* ==========================================================
     SCROLL PROGRESS
     ========================================================== */

  (function initScrollProgress() {

    var bar = document.getElementById("scrollProgress");
    if (!bar) return;

    var ticking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var pct = height > 0 ? Math.min(1, scrollTop / height) : 0;
      bar.style.transform = "scaleX(" + pct + ")";
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();

  })();


  /* ==========================================================
     MARQUEE TICKER
     ========================================================== */

  (function initMarquee() {

    var track = document.getElementById("marqueeTrack");
    if (!track) return;

    var marqueeContent = SITE_CONTENT.marquee || {};
    var lines = marqueeContent.lines || [];

    var html = lines.map(function (line) {
      return "<span>" + escapeHTML(line) + "</span>";
    }).join("<span>·</span>");

    track.innerHTML = html + html;

  })();


  /* ==========================================================
     VISITOR COUNTER
     ========================================================== */

  (function initVisitorCounter() {

    var el = document.getElementById("visitorCount");
    if (!el) return;

    var counterContent = SITE_CONTENT.visitorCounter || {};
    var STORAGE_KEY = counterContent.storageKey || "mahinGayVisitorCount";
    var SESSION_KEY = counterContent.sessionKey || "mahinGayVisitedThisSession";
    var startingNumber = Number.isFinite(Number(counterContent.startingNumber))
      ? Math.max(0, Math.floor(Number(counterContent.startingNumber))) : 14027;

    var count = parseInt(storeGet(STORAGE_KEY), 10);
    if (isNaN(count) || count < startingNumber) count = startingNumber;

    if (!sessionGet(SESSION_KEY)) {
      count += 1;
      storeSet(STORAGE_KEY, String(count));
      sessionSet(SESSION_KEY, "1");
    }

    el.textContent = String(count).padStart(6, "0");

  })();


  /* ==========================================================
     SCROLL REVEAL FOR ARTIST SECTIONS
     ========================================================== */

  (function initReveal() {

    var sections = document.querySelectorAll(".artist");
    if (!sections.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      sections.forEach(function (s) { s.classList.add("in-view"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    sections.forEach(function (s) { observer.observe(s); });

  })();


  /* ==========================================================
     BACK TO TOP
     ========================================================== */

  (function initBackToTop() {

    var btn = document.getElementById("backToTop");
    if (!btn) return;

    window.addEventListener("scroll", function () {
      btn.classList.toggle("visible", window.scrollY > 800);
    }, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

  })();


  /* ==========================================================
     BACKGROUND ROTATION
     ========================================================== */

  (function initBackdrop() {

    var root = document.getElementById("bgwrap");
    if (!root || !BACKGROUNDS.length) return;

    var layers = [document.createElement("div"), document.createElement("div")];
    layers.forEach(function (layer, i) {
      layer.className = "layer" + (i === 0 ? " on" : "");
      root.appendChild(layer);
    });

    var order = shuffle(BACKGROUNDS.map(function (_, i) { return i; }));
    var currentIndex = 0, activeLayer = 0;

    layers[0].style.backgroundImage = 'url("' + BACKGROUNDS[order[0]] + '")';

    if (!reduceMotion && BACKGROUNDS.length > 1) {
      setInterval(function () {
        currentIndex = (currentIndex + 1) % order.length;
        var next = layers[1 - activeLayer];
        var current = layers[activeLayer];
        next.style.backgroundImage = 'url("' + BACKGROUNDS[order[currentIndex]] + '")';
        requestAnimationFrame(function () {
          next.classList.add("on");
          current.classList.remove("on");
          activeLayer = 1 - activeLayer;
        });
      }, SITE_CONTENT.backgroundRotationTime || 13000);
    }

  })();


  /* ==========================================================
     ENTRY GATE
     ========================================================== */

  var gate = document.getElementById("gate");
  var gateFlash = document.getElementById("gateFlash");
  var GATE_CLOSE_MS = 550;
  var wantsAutoplay = false;

  function openGate() {

    if (!gate || gate.classList.contains("gate-closing") || gate.classList.contains("gate-closed")) return;

    if (!bootReady && typeof bootFinish === "function") bootFinish();

    wantsAutoplay = true;

    /* Phones only let audio start from a direct tap. Do it right here,
       not inside the timeout below. */
    try {
      if (youtubePlayer && youtubeReady) {
        if (youtubePlayer.setVolume) youtubePlayer.setVolume(savedVolume);
        youtubePlayer.playVideo();
      }
    } catch (err) {}

    function finish() {
      gate.classList.add("gate-closed");
      gate.classList.remove("gate-closing");
      document.body.classList.add("site-entered");
      if (youtubePlayer && youtubeReady && !playerPlaying) { try { youtubePlayer.playVideo(); } catch (err) {} }
    }

    if (reduceMotion) { finish(); return; }

    gate.classList.add("gate-closing");

    if (gateFlash) {
      setTimeout(function () { gateFlash.classList.add("gate-flash-on"); }, GATE_CLOSE_MS * 0.6);
    }

    setTimeout(finish, GATE_CLOSE_MS);

  }

  if (gate) {
    gate.addEventListener("click", openGate);
    var enterBtn = document.getElementById("gateEnter");
    if (enterBtn) {
      enterBtn.addEventListener("click", function (e) { e.stopPropagation(); openGate(); });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (gate && !gate.classList.contains("gate-closed") &&
        !gate.classList.contains("gate-closing") && e.key === "Enter") {
      openGate();
    }
  });


  /* ==========================================================
     FLOATING PLAYER + NOW PLAYING OVERLAY — element refs
     Arrays hold [compact-bar element, overlay element] so one
     update touches both UIs at once.
     ========================================================== */

  var floatingArtist = document.getElementById("floatingArtist");
  var playerElement = document.getElementById("floatingArtistPlayer");

  var imageEls = [document.getElementById("floatingArtistImage"), document.getElementById("nowPlayingImage")];
  var nameEls = [document.getElementById("floatingArtistName"), document.getElementById("nowPlayingName")];
  var songEls = [document.getElementById("floatingArtistSong"), document.getElementById("nowPlayingSong")];
  var statusEls = [document.getElementById("floatingStatus"), document.getElementById("nowPlayingStatus")];
  var playBtnEls = [document.getElementById("floatingPlayPause"), document.getElementById("nowPlayingPlayPause")];
  var prevBtnEls = [document.getElementById("floatingPrevious"), document.getElementById("nowPlayingPrevious")];
  var nextBtnEls = [document.getElementById("floatingNext"), document.getElementById("nowPlayingNext")];
  var volumeEls = [document.getElementById("floatingVolume"), document.getElementById("nowPlayingVolume")];
  var volumeIconEls = [document.getElementById("floatingVolumeIcon"), document.getElementById("nowPlayingVolumeIcon")];

  var seekTrackEls = [document.getElementById("floatingSeekTrack"), document.getElementById("nowPlayingSeekTrack")];
  var seekFillEls = [document.getElementById("floatingSeekFill"), document.getElementById("nowPlayingSeekFill")];
  var seekThumbEls = [document.getElementById("floatingSeekThumb"), document.getElementById("nowPlayingSeekThumb")];
  var timeCurrentEls = [document.getElementById("floatingTimeCurrent"), document.getElementById("nowPlayingTimeCurrent")];
  var timeDurationEls = [document.getElementById("floatingTimeDuration"), document.getElementById("nowPlayingTimeDuration")];

  var progressFillEls = [document.getElementById("floatingProgressFill")];

  var minimizeBtn = document.getElementById("floatingMinimize");
  var restoreBtn = document.getElementById("floatingRestore");
  var expandBtn = document.getElementById("floatingExpandBtn");
  var nowPlayingOverlay = document.getElementById("nowPlayingOverlay");
  var nowPlayingClose = document.getElementById("nowPlayingClose");


  /* ==========================================================
     PLAYER STATE
     ========================================================== */

  var youtubePlayer = null;
  var youtubeReady = false;
  var playerPlaying = false;

  var seekPollId = null;
  var isScrubbing = false;
  var lastKnownDuration = 0;

  var order = [];
  for (var fi = 0; fi < FLOATING_ARTISTS.length; fi++) {
    if (FLOATING_ARTISTS[fi].youtube) order.push(fi);
  }
  order = shuffle(order);
  var position = 0;


  /* ==========================================================
     VOLUME
     ========================================================== */

  var playerContent = SITE_CONTENT.player || {};
  var volumeStorageKey = playerContent.volumeStorageKey || "mahinGayVolume";
  var defaultVolume = Number.isFinite(Number(playerContent.defaultVolume)) ? Number(playerContent.defaultVolume) : 70;

  var savedVolume = parseInt(storeGet(volumeStorageKey), 10);
  if (isNaN(savedVolume)) savedVolume = defaultVolume;
  savedVolume = Math.max(0, Math.min(100, savedVolume));
  volumeEls.forEach(function (el) { if (el) el.value = savedVolume; });


  /* ==========================================================
     PLAY BUTTON / STATUS
     ========================================================== */

  function updatePlayButton() {

    playBtnEls.forEach(function (btn) {
      if (!btn) return;
      btn.innerHTML = playerPlaying ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute("aria-label", playerPlaying ? "Pause" : "Play");
    });

    if (floatingArtist) floatingArtist.classList.toggle("player-paused", !playerPlaying);
    if (nowPlayingOverlay) nowPlayingOverlay.classList.toggle("now-playing-playing", playerPlaying);

    setText(statusEls, playerPlaying ? "[PLAYING]" : "[PAUSED]");
    statusEls.forEach(function (el) { if (el) el.classList.toggle("status-playing", playerPlaying); });

  }

  function updateVolumeIcon() {
    volumeEls.forEach(function (input, i) {
      if (!input || !volumeIconEls[i]) return;
      var v = Number(input.value);
      volumeIconEls[i].innerHTML = v === 0 ? ICON_VOL_MUTE : v < 40 ? ICON_VOL_LOW : ICON_VOL_HIGH;
    });
  }


  /* ==========================================================
     PLAYBACK ADVANCES BY REAL VIDEO DURATION
     The old fixed 25-second rotation cut songs off mid-playback.
     We now advance only on the YouTube ENDED event.
     ========================================================== */

  var activeStartOffset = 0;
  var activeClipLength = PLAYER_ROTATION_TIME / 1000;   // seconds each song plays (content.js: playerRotationTime)
  var clipAdvancing = false;
  var hasPaintedPlayerArtist = false;
  var selectedPlayerVideoId = "";
  var playerErrorSkipPending = false;


  /* ==========================================================
     SONG SEEK BAR — the only visible progress indicator.
     One interval, alive only while playing, cleared the
     moment playback pauses/ends/switches — never stacked.
     ========================================================== */

  /* ---- seek bar: the real song, like YouTube Music ---- */

  function paintSeek(pct, elapsed, total) {

    pct = Math.max(0, Math.min(100, pct || 0));

    seekFillEls.forEach(function (el) { if (el) el.style.width = pct + "%"; });
    seekThumbEls.forEach(function (el) { if (el) el.style.left = pct + "%"; });
    seekTrackEls.forEach(function (el) {
      if (!el) return;
      el.setAttribute("aria-valuenow", String(Math.round(pct)));
      el.setAttribute("aria-valuetext", formatTime(elapsed) + " of " + formatTime(total));
    });

    setText(timeCurrentEls, formatTime(elapsed));
    setText(timeDurationEls, formatTime(total));        // full song length

  }

  function updateSeekUI(current, duration) {

    if (isScrubbing) return;

    var total = duration > 0 ? duration : 0;
    var elapsed = total > 0 ? Math.max(0, Math.min(current, total)) : 0;

    paintSeek(total > 0 ? (elapsed / total) * 100 : 0, elapsed, total);

  }

  /* ---- site timer: how long each song plays before the next artist ----
     Set in content.js (playerRotationTime). It only counts while the music
     is actually playing, and it is the thin line along the top of the bar. */

  var SEEK_RESTARTS_TIMER = SITE_CONTENT.seekRestartsTimer === true;   // default: OFF, seeking never adds time
  var rotationElapsed = 0;
  var lastRotationTs = 0;
  var rotationLabelEls = [document.getElementById("floatingRotation"), document.getElementById("nowPlayingRotation")];

  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function paintRotation() {

    if (spotifyModeActive) {
      var spotifyFraction = spotifyDurationSeconds > 0 ? Math.max(0, Math.min(1, spotifyPositionSeconds / spotifyDurationSeconds)) : 0;
      progressFillEls.forEach(function (el) { if (el) el.style.transform = "scaleX(" + spotifyFraction + ")"; });
      rotationLabelEls.forEach(function (el) { if (el) el.textContent = "SPOTIFY"; });
      return;
    }

    var left = Math.max(0, Math.ceil(activeClipLength - rotationElapsed));
    var fraction = activeClipLength > 0 ? Math.min(1, rotationElapsed / activeClipLength) : 0;

    progressFillEls.forEach(function (el) { if (el) el.style.transform = "scaleX(" + fraction + ")"; });
    rotationLabelEls.forEach(function (el) { if (el) el.textContent = "next " + formatTime(left); });

  }

  function resetRotation() {
    rotationElapsed = 0;
    lastRotationTs = nowMs();
    paintRotation();
  }

  function tickSeek() {

    var now = nowMs();
    var delta = Math.min(2, Math.max(0, (now - lastRotationTs) / 1000));
    lastRotationTs = now;

    if (spotifyModeActive) {
      if (spotifyPlaying) spotifyPositionSeconds += delta;
      if (spotifyDurationSeconds > 0) spotifyPositionSeconds = Math.min(spotifyPositionSeconds, spotifyDurationSeconds);
      updateSeekUI(spotifyPositionSeconds, spotifyDurationSeconds);
      paintRotation();
      return;
    }

    if (playerPlaying) rotationElapsed += delta;
    paintRotation();

    if (youtubePlayer && youtubeReady) {
      try {
        var current = youtubePlayer.getCurrentTime();
        var duration = youtubePlayer.getDuration();
        if (duration > 0) lastKnownDuration = duration;
        updateSeekUI(current || 0, duration > 0 ? duration : lastKnownDuration);
      } catch (err) { /* iframe not ready yet, skip this tick */ }
    }

    if (playerPlaying && !clipAdvancing && rotationElapsed >= activeClipLength) {
      clipAdvancing = true;
      nextArtist();
    }

  }

  function startSeekPolling() {
    if (seekPollId !== null) return;
    lastRotationTs = nowMs();
    tickSeek();
    seekPollId = setInterval(tickSeek, 200);
  }

  function stopSeekPolling() {
    if (seekPollId !== null) { clearInterval(seekPollId); seekPollId = null; }
  }

  function seekFromPointer(trackEl, clientX) {

    if (!trackEl || (spotifyModeActive ? !activeSpotifyController : (!youtubePlayer || !youtubeReady))) return;

    var rect = trackEl.getBoundingClientRect();
    if (!rect.width) return;
    var fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    var duration = spotifyModeActive ? spotifyDurationSeconds : (lastKnownDuration || (function () {
      try { return youtubePlayer.getDuration(); } catch (e) { return 0; }
    })());
    if (!(duration > 0)) return;

    var target = fraction * duration;
    paintSeek(fraction * 100, target, duration);

    return target;

  }

  seekTrackEls.forEach(function (trackEl) {

    if (!trackEl) return;

    trackEl.addEventListener("pointerdown", function (e) {
      isScrubbing = true;
      try { trackEl.setPointerCapture(e.pointerId); } catch (err) {}
      seekFromPointer(trackEl, e.clientX);
    });

    trackEl.addEventListener("pointermove", function (e) {
      if (isScrubbing) seekFromPointer(trackEl, e.clientX);
    });

    function endScrub(e) {
      if (!isScrubbing) return;
      isScrubbing = false;
      var target = seekFromPointer(trackEl, e.clientX);
      if (typeof target === "number") {
        if (spotifyModeActive && activeSpotifyController) {
          try { activeSpotifyController.seek(Math.floor(target)); spotifyPositionSeconds = target; } catch (err) {}
        } else if (youtubePlayer && youtubeReady) {
          try { youtubePlayer.seekTo(target, true); } catch (err) {}
          if (SEEK_RESTARTS_TIMER) resetRotation();   // fresh rotation window from the new spot
        }
      }
    }

    trackEl.addEventListener("pointerup", endScrub);
    trackEl.addEventListener("pointercancel", function () { isScrubbing = false; });

    trackEl.addEventListener("keydown", function (e) {
      if (spotifyModeActive ? !activeSpotifyController : (!youtubePlayer || !youtubeReady)) return;
      var delta = e.shiftKey ? 15 : 5;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var targetTime = spotifyModeActive ? spotifyPositionSeconds : 0;
      if (!spotifyModeActive) { try { targetTime = youtubePlayer.getCurrentTime() || 0; } catch (err) {} }
      targetTime += e.key === "ArrowRight" ? delta : -delta;
      targetTime = Math.max(0, Math.min((spotifyModeActive ? spotifyDurationSeconds : lastKnownDuration) || targetTime, targetTime));
      if (spotifyModeActive) {
        try { activeSpotifyController.seek(Math.floor(targetTime)); spotifyPositionSeconds = targetTime; } catch (err) {}
      } else {
        try { youtubePlayer.seekTo(targetTime, true); } catch (err) {}
        if (SEEK_RESTARTS_TIMER) resetRotation();
      }
    });

  });


  /* ==========================================================
     ARTIST TRANSITION + THEMING
     ========================================================== */

  function applyAccent(artist) {
    if (floatingArtist) floatingArtist.style.setProperty("--player-accent", artist.accent);
    var card = nowPlayingOverlay && nowPlayingOverlay.querySelector(".now-playing-card");
    if (card) card.style.setProperty("--player-accent", artist.accent);
  }

  function showArtist(autoPlay) {

    if (!order.length) return;
    deactivateSpotifyMirror();

    var artist = FLOATING_ARTISTS[order[position]];
    selectedPlayerVideoId = artist.youtube;
    playerErrorSkipPending = false;
    stopSeekPolling();
    lastKnownDuration = 0;
    activeStartOffset = Math.max(0, Number(artist.start) || 0);
    activeClipLength = Math.max(5, Number(artist.clip) || (PLAYER_ROTATION_TIME / 1000));
    clipAdvancing = false;
    resetRotation();

    function paint() {

      imageEls.forEach(function (el) { if (el) { el.src = artist.image; el.alt = artist.name; } });
      setText(nameEls, artist.name);
      setText(songEls, artist.song);

      applyAccent(artist);

      if (youtubePlayer && youtubeReady) {
        // playerPlaying is set by YouTube's own state events, so the button
        // never claims "playing" when a phone has blocked autoplay.
        playerPlaying = false;
        if (autoPlay) {
          youtubePlayer.loadVideoById({ videoId: artist.youtube, startSeconds: artist.start || 0 });
        } else {
          youtubePlayer.cueVideoById({ videoId: artist.youtube, startSeconds: artist.start || 0 });
        }
      }

      updatePlayButton();
      updateSeekUI(0, 0);

      if (floatingArtist) floatingArtist.classList.remove("player-switching");
      hasPaintedPlayerArtist = true;

    }

    if (reduceMotion || !floatingArtist || !hasPaintedPlayerArtist) { paint(); return; }

    floatingArtist.classList.add("player-switching");
    setTimeout(paint, 70);

  }

  function nextArtist() {

    if (!order.length) return;

    stopSeekPolling();
    playerPlaying = false;
    position++;

    if (position >= order.length) {
      position = 0;
      order = shuffle(
        FLOATING_ARTISTS.map(function (a, i) { return a.youtube ? i : null; })
          .filter(function (i) { return i !== null; })
      );
    }

    showArtist(true);

  }

  function previousArtist() {
    if (!order.length) return;
    stopSeekPolling();
    playerPlaying = false;
    position = position <= 0 ? order.length - 1 : position - 1;
    showArtist(true);
  }

  function togglePlay() {
    if (spotifyModeActive && activeSpotifyController) {
      try {
        if (spotifyPlaying) activeSpotifyController.pause();
        else activeSpotifyController.resume();
      } catch (err) { console.warn('Spotify playback control failed:', err); }
      return;
    }
    if (!youtubePlayer || !youtubeReady) return;
    if (playerPlaying) youtubePlayer.pauseVideo(); else youtubePlayer.playVideo();
  }


  /* ==========================================================
     YOUTUBE API
     ========================================================== */

  function loadYouTubeAPI(callback) {
    if (window.YT && window.YT.Player) { callback(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); callback(); };
  }

  loadYouTubeAPI(function () {

    if (!order.length) return;

    var first = FLOATING_ARTISTS[order[0]];

    youtubePlayer = new YT.Player(playerElement, {

      width: "200",
      height: "200",
      videoId: first.youtube,

      playerVars: {
        autoplay: 0, controls: 0, playsinline: 1, rel: 0,
        iv_load_policy: 3, enablejsapi: 1, origin: window.location.origin
      },

      events: {

        onReady: function () {

          youtubeReady = true;
          if (youtubePlayer.setVolume) youtubePlayer.setVolume(savedVolume);

          playerPlaying = false;
          applyAccent(first);
          // Cue once when the user has not entered yet; otherwise begin immediately.
          showArtist(wantsAutoplay);

        },

        onStateChange: function (event) {

          var S = YT.PlayerState;
          if (spotifyModeActive && event.data !== S.PLAYING) return;

          if (event.data === S.PLAYING) {

            playerPlaying = true;
            updatePlayButton();
            startSeekPolling();

          } else if (event.data === S.BUFFERING) {

            startSeekPolling();

          } else if (event.data === S.PAUSED) {

            playerPlaying = false;
            stopSeekPolling();
            tickSeek();
            updatePlayButton();

          } else if (event.data === S.CUED || event.data === S.UNSTARTED) {

            // Not playing (yet): either cued, or the browser blocked autoplay.
            playerPlaying = false;
            stopSeekPolling();
            updatePlayButton();
            setTimeout(tickSeek, 500);

          } else if (event.data === S.ENDED) {

            playerPlaying = false;
            stopSeekPolling();
            nextArtist();

          }

        },

        onError: function () {
          // A removed/blocked video should not leave the player stuck.
          if (playerErrorSkipPending || order.length < 2) return;
          var failedVideoId = "";
          try { failedVideoId = youtubePlayer.getVideoData().video_id || ""; } catch (err) {}
          if (failedVideoId && selectedPlayerVideoId && failedVideoId !== selectedPlayerVideoId) return;
          playerErrorSkipPending = true;
          stopSeekPolling();
          playerPlaying = false;
          updatePlayButton();
          window.setTimeout(function () {
            if (playerErrorSkipPending) nextArtist();
          }, 700);
        }

      }

    });

  });


  /* ==========================================================
     PLAYER CONTROLS
     ========================================================== */

  prevBtnEls.forEach(function (btn) { if (btn) btn.addEventListener("click", previousArtist); });
  nextBtnEls.forEach(function (btn) { if (btn) btn.addEventListener("click", nextArtist); });
  playBtnEls.forEach(function (btn) { if (btn) btn.addEventListener("click", togglePlay); });


  /* --- expand / collapse now-playing overlay --- */

  function openNowPlaying() {
    if (!nowPlayingOverlay) return;
    nowPlayingOverlay.classList.add("now-playing-open");
    nowPlayingOverlay.setAttribute("aria-hidden", "false");
    nowPlayingOverlay.classList.toggle("now-playing-playing", playerPlaying);
  }

  function closeNowPlaying() {
    if (!nowPlayingOverlay) return;
    nowPlayingOverlay.classList.remove("now-playing-open");
    nowPlayingOverlay.setAttribute("aria-hidden", "true");
  }

  if (expandBtn) expandBtn.addEventListener("click", openNowPlaying);
  if (nowPlayingClose) nowPlayingClose.addEventListener("click", closeNowPlaying);

  if (nowPlayingOverlay) {
    nowPlayingOverlay.addEventListener("click", function (e) {
      if (e.target === nowPlayingOverlay) closeNowPlaying();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nowPlayingOverlay && nowPlayingOverlay.classList.contains("now-playing-open")) {
      closeNowPlaying();
    }
  });

  /* tapping the mini-player bar on mobile opens the overlay too */

  var floatingBar = document.getElementById("floatingBar");
  if (floatingBar) {
    floatingBar.addEventListener("click", function (e) {
      if (window.innerWidth > 900) return;
      if (e.target.closest("button") || e.target.closest("input") ||
          e.target.closest(".sticky-player-seek-track") || e.target.closest(".sticky-player-transport")) return;
      openNowPlaying();
    });
  }


  /* --- minimize / restore --- */

  var PLAYER_MIN_KEY = "mahinGayPlayerMinimized";

  function setMinimized(min) {
    if (!floatingArtist) return;
    floatingArtist.classList.toggle("player-minimized", min);
    if (restoreBtn) restoreBtn.hidden = !min;
    applyPlayerHeight();
    try { localStorage.setItem(PLAYER_MIN_KEY, min ? "1" : "0"); } catch (err) {}
  }

  if (minimizeBtn) minimizeBtn.addEventListener("click", function (e) { e.stopPropagation(); setMinimized(true); });
  if (restoreBtn) restoreBtn.addEventListener("click", function () { setMinimized(false); });

  try {
    if (localStorage.getItem(PLAYER_MIN_KEY) === "1") setMinimized(true);
  } catch (err) {}


  /* ==========================================================
     VOLUME CONTROL
     ========================================================== */

  updateVolumeIcon();

  volumeEls.forEach(function (input) {

    if (!input) return;

    input.addEventListener("input", function () {

      if (spotifyModeActive) return; // Spotify Embed API does not expose per-embed volume control.
      var v = Number(input.value);

      volumeEls.forEach(function (other) { if (other && other !== input) other.value = v; });

      if (youtubePlayer && youtubeReady && youtubePlayer.setVolume) youtubePlayer.setVolume(v);

      storeSet(volumeStorageKey, String(v));
      updateVolumeIcon();

    });

  });


  /* ==========================================================
     KEYBOARD CONTROLS
     ========================================================== */

  document.addEventListener("keydown", function (event) {

    var tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    }

  });


  /* ==========================================================
     PLAYER HEIGHT -> CSS VARIABLE
     The bar is taller on phones (two rows). Floating buttons and the
     footer read --player-h so nothing ends up hidden underneath it.
     ========================================================== */

  function applyPlayerHeight() {
    var h = 0;
    if (floatingArtist) {
      h = floatingArtist.classList.contains("player-minimized") ? 52 : (floatingArtist.offsetHeight || 0);
    }
    document.documentElement.style.setProperty("--player-h", h + "px");
  }

  if (floatingArtist && "ResizeObserver" in window) new ResizeObserver(applyPlayerHeight).observe(floatingArtist);
  window.addEventListener("resize", applyPlayerHeight);
  window.addEventListener("orientationchange", applyPlayerHeight);
  applyPlayerHeight();


  /* ==========================================================
     ONE THING PLAYING AT A TIME
     Clicking into any Spotify / YouTube embed on the page pauses the
     floating player (the hidden YouTube player is not clickable).
     ========================================================== */

  window.addEventListener("blur", function () {
    setTimeout(function () {
      var active = document.activeElement;
      if (!playerPlaying || !active || active.tagName !== "IFRAME") return;
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (active.closest && active.closest(".sticky-player-youtube")) return;
      togglePlay();
    }, 0);
  });


  /* ==========================================================
     INITIAL STATE
     ========================================================== */

  updatePlayButton();

})();