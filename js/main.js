document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        view: 'entry',      // 'entry' | 'detail' | 'player'
        entryIndex: 0,       // Start focused on 1st card (Weather)
        detailIndex: 0,
        cardsCount: 4,
        previewTimeout: null
    };

    // --- DOM ---
    const views = {
        entry: document.getElementById('entry-ui'),
        detail: document.getElementById('detail-ui'),
        loading: document.getElementById('loading-ui'),
        player: document.getElementById('player-ui')
    };

    const carousels = {
        entry: document.getElementById('main-carousel'),
        detail: document.getElementById('detail-carousel')
    };

    const entryCards = document.querySelectorAll('#entry-ui .card');
    const detailCards = document.querySelectorAll('#detail-ui .card');
    const mainPlayer = document.getElementById('main-player');

    // --- Time/Date Update ---
    function updateTime() {
        const timeEls = document.querySelectorAll('.current-time');
        const dateEls = document.querySelectorAll('.current-date');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        timeEls.forEach(el => el.textContent = timeStr);
        dateEls.forEach(el => el.textContent = dateStr);
    }
    setInterval(updateTime, 1000);
    updateTime();

    // --- View Switching ---
    function switchView(newView) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[newView].classList.add('active');
        state.view = newView;
        stopAllPreviews();

        if (newView === 'entry' || newView === 'detail') {
            updateFocus();
        } else if (newView === 'loading') {
            // Simulate Bloomberg app launch sequence
            setTimeout(() => {
                if (state.view === 'loading') { // check if not cancelled
                    switchView('player');
                }
            }, 2000);
        } else if (newView === 'player') {
            const video = detailCards[state.detailIndex].dataset.video;
            mainPlayer.src = 'assets/videos/' + video;
            mainPlayer.play();
        }
    }

    // --- Focus Management ---
    function updateFocus() {
        entryCards.forEach(c => c.classList.remove('focused'));
        detailCards.forEach(c => c.classList.remove('focused'));

        let cards, index, carousel;
        if (state.view === 'entry') {
            cards = entryCards;
            index = state.entryIndex;
            carousel = carousels.entry;

            cards[index].classList.add('focused');

            // Reset DOM order to its natural sequence so all 4 cards are visible
            const track = carousel;
            track.appendChild(cards[0]);
            track.appendChild(cards[1]);
            track.appendChild(cards[2]);
            track.appendChild(cards[3]);

            carousel.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            carousel.style.transform = 'translateX(0px)';
        } else {
            // Detail view: identical static 4-card layout
            cards = detailCards;
            index = state.detailIndex;
            carousel = carousels.detail;

            cards[index].classList.add('focused');

            const track = carousel;
            track.appendChild(cards[0]);
            track.appendChild(cards[1]);
            track.appendChild(cards[2]);
            track.appendChild(cards[3]);

            carousel.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            carousel.style.transform = 'translateX(0px)';
        }

        handlePreview(cards[index]);
    }

    // --- Preview ---
    function stopAllPreviews() {
        document.querySelectorAll('.preview-video').forEach(v => {
            v.pause();
            v.currentTime = 0;
            v.classList.remove('play-preview');
        });
        clearTimeout(state.previewTimeout);
    }

    function handlePreview(card) {
        stopAllPreviews();
        const video = card.querySelector('.preview-video');
        if (!video) return;

        state.previewTimeout = setTimeout(() => {
            video.classList.add('play-preview');
            video.play().catch(() => { });
        }, 800);
    }

    // --- Input ---
    window.addEventListener('keydown', (e) => {
        const isBack = e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009;

        if (state.view === 'entry') {
            if (e.key === 'ArrowRight') {
                state.entryIndex = (state.entryIndex + 1) % state.cardsCount;
                updateFocus();
            } else if (e.key === 'ArrowLeft') {
                state.entryIndex = (state.entryIndex - 1 + state.cardsCount) % state.cardsCount;
                updateFocus();
            } else if (e.key === 'Enter') {
                // Only Bloomberg card (index 1) opens detail
                if (state.entryIndex === 1) {
                    state.detailIndex = 0;
                    switchView('detail');
                }
            } else if (isBack) {
                try { tizen.application.getCurrentApplication().exit(); } catch (e) { }
            }
        }
        else if (state.view === 'detail') {
            if (e.key === 'ArrowRight' && state.detailIndex < state.cardsCount - 1) {
                state.detailIndex++;
                updateFocus();
            } else if (e.key === 'ArrowLeft' && state.detailIndex > 0) {
                state.detailIndex--;
                updateFocus();
            } else if (e.key === 'Enter') {
                switchView('loading');
            } else if (isBack) {
                switchView('entry');
            }
        }
        else if (state.view === 'player') {
            if (isBack) {
                mainPlayer.pause();
                switchView('detail');
            } else if (e.key === 'Enter') {
                mainPlayer.paused ? mainPlayer.play() : mainPlayer.pause();
            } else if (e.key === 'ArrowRight') {
                mainPlayer.currentTime += 10;
            } else if (e.key === 'ArrowLeft') {
                mainPlayer.currentTime -= 10;
            }
        }
    });

    // --- Init ---
    updateFocus();

    // Tizen key registration
    if (typeof tizen !== 'undefined') {
        try {
            tizen.tvinputdevice.registerKey('MediaPlayPause');
            tizen.tvinputdevice.registerKey('Return');
        } catch (e) { }
    }
});
