// Pomodoro Timer App
class PomodoroTimer {
  constructor() {
    console.log('[App] Constructor called - initializing PomodoroTimer');
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      console.log('[App] Loading settings from localStorage:', savedSettings);
      const settings = JSON.parse(savedSettings);
      // Convert minutes to seconds (handle both integer and decimal values)
      this.sessionDuration = Math.round((settings.sessionDuration || 25) * 60);
      this.breakDuration = Math.round((settings.breakDuration || 5) * 60);
      console.log('[App] Loaded settings - sessionDuration:', this.sessionDuration, 'seconds, breakDuration:', this.breakDuration, 'seconds');
    } else {
      console.log('[App] No saved settings found, using defaults');
      this.sessionDuration = 25 * 60; // 25 minutes in seconds
      this.breakDuration = 5 * 60; // 5 minutes in seconds
      console.log('[App] Default settings - sessionDuration:', this.sessionDuration, 'seconds, breakDuration:', this.breakDuration, 'seconds');
    }
    
    this.timeLeft = this.sessionDuration;
    this.isRunning = false;
    this.isBreak = false;
    this.intervalId = null;
    this.audioContext = null;
    this.uiHidden = false;
    this.settingsOpen = false;
    this.hideUITimeout = null;
    this.showingCTAs = false;
    
    console.log('[App] Initial state - timeLeft:', this.timeLeft, '| isRunning:', this.isRunning, '| isBreak:', this.isBreak, '| uiHidden:', this.uiHidden, '| settingsOpen:', this.settingsOpen, '| showingCTAs:', this.showingCTAs);
    
    this.init();
  }

  init() {
    console.log('[App] init() called - setting up UI and event listeners');
    this.createUI();
    this.attachEventListeners();
    this.updateDisplay();
    console.log('[App] Initialization complete');
  }

  createUI() {
    console.log('[UI] createUI() called - building DOM structure');
    const app = document.getElementById('app');
    if (!app) {
      console.error('[UI] Error: #app element not found!');
      return;
    }
    console.log('[UI] Creating UI with state - uiHidden:', this.uiHidden, '| isBreak:', this.isBreak, '| showingCTAs:', this.showingCTAs, '| settingsOpen:', this.settingsOpen);
    app.innerHTML = `
      <div class="header-top">
        <h1 class="title"><span class="tomato-icon">🍅</span>Pomodoro</h1>
        <button class="btn-icon" id="settingsBtn" title="Settings">
          <span>⚙️</span>
        </button>
      </div>
      
      <div class="container ${this.uiHidden ? 'ui-hidden' : ''}">
        <div class="glass-card">
          <div class="header ${this.uiHidden ? 'hidden' : ''}">
            <div class="session-indicator">
              <span class="indicator ${!this.isBreak ? 'active' : ''}" data-type="session">
                <span class="icon-small">🍅</span>
                Work
              </span>
              <span class="indicator ${this.isBreak ? 'active' : ''}" data-type="break">
                <span class="icon-small">🍌</span>
                Break
              </span>
            </div>
          </div>

          <div class="timer-container">
            <div class="timer-circle" id="timerCircle">
              <svg class="progress-ring" width="280" height="280" viewBox="0 0 280 280" style="overflow: visible;">
                <circle
                  class="progress-ring-circle-bg"
                  stroke="rgba(255, 255, 255, 0.1)"
                  stroke-width="8"
                  fill="transparent"
                  r="130"
                  cx="140"
                  cy="140"
                />
                <circle
                  class="progress-ring-circle"
                  stroke="url(#gradient)"
                  stroke-width="8"
                  fill="transparent"
                  r="130"
                  cx="140"
                  cy="140"
                  stroke-dasharray="816.814"
                  stroke-dashoffset="0"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ff8787;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="timer-display">
                <div class="time-text" id="timeDisplay">25:00</div>
                <div class="status-icon" id="statusIcon" style="display: none;"></div>
              </div>
            </div>
          </div>

          <div class="controls ${this.uiHidden ? 'hidden' : ''}">
            <button class="btn btn-primary" id="startPauseBtn">
              <span class="btn-text">Start</span>
            </button>
            <button class="btn btn-secondary" id="extendBtn" title="Add 5 minutes">
              <span class="btn-text">+5 min</span>
            </button>
            <button class="btn btn-secondary" id="resetBtn">
              <span class="btn-text">Reset</span>
            </button>
          </div>

          <div class="cta-buttons ${this.showingCTAs ? '' : 'hidden'}">
            <button class="btn btn-secondary" id="addTimeBtn">
              <span class="btn-text">+ Add Time</span>
            </button>
            <button class="btn btn-primary" id="startBreakBtn">
              <span class="btn-text">Start Break</span>
            </button>
          </div>
        </div>

        <!-- Settings Panel -->
        <div class="settings-overlay ${this.settingsOpen ? 'open' : ''}" id="settingsOverlay">
          <div class="settings-panel glass-card">
            <div class="settings-header">
              <h2>Settings</h2>
              <button class="btn-icon" id="closeSettingsBtn">
                <span>✕</span>
              </button>
            </div>
            <div class="settings-content">
              <div class="setting-item">
                <label for="sessionDuration">Work Duration (minutes)</label>
                <input 
                  type="number" 
                  id="sessionDuration" 
                  min="0.1" 
                  max="60" 
                  step="0.1"
                  value="${(this.sessionDuration / 60).toFixed(1)}"
                />
              </div>
              <div class="setting-item">
                <label for="breakDuration">Break Duration (minutes)</label>
                <input 
                  type="number" 
                  id="breakDuration" 
                  min="0.1" 
                  max="30" 
                  step="0.1"
                  value="${(this.breakDuration / 60).toFixed(1)}"
                />
              </div>
              <button class="btn btn-primary" id="saveSettingsBtn">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;
    console.log('[UI] UI structure created successfully');
  }

  attachEventListeners() {
    console.log('[Events] attachEventListeners() called - setting up all event handlers');
    
    document.getElementById('startPauseBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] startPauseBtn clicked');
      this.toggleTimer();
    });
    console.log('[Events] startPauseBtn listener attached');
    
    document.getElementById('extendBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] extendBtn clicked');
      this.extendTimer();
    });
    console.log('[Events] extendBtn listener attached');
    
    document.getElementById('resetBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] resetBtn clicked');
      this.resetTimer();
    });
    console.log('[Events] resetBtn listener attached');
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] settingsBtn clicked');
      this.openSettings();
    });
    console.log('[Events] settingsBtn listener attached');
    
    document.getElementById('closeSettingsBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] closeSettingsBtn clicked');
      this.closeSettings();
    });
    console.log('[Events] closeSettingsBtn listener attached');
    
    document.getElementById('saveSettingsBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Events] saveSettingsBtn clicked');
      this.saveSettings();
    });
    console.log('[Events] saveSettingsBtn listener attached');
    
    // CTA buttons
    const addTimeBtn = document.getElementById('addTimeBtn');
    const startBreakBtn = document.getElementById('startBreakBtn');
    if (addTimeBtn) {
      addTimeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[Events] addTimeBtn clicked');
        this.addTimeFromCTA();
      });
      console.log('[Events] addTimeBtn listener attached');
    } else {
      console.warn('[Events] addTimeBtn not found');
    }
    if (startBreakBtn) {
      startBreakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[Events] startBreakBtn clicked');
        this.startBreakFromCTA();
      });
      console.log('[Events] startBreakBtn listener attached');
    } else {
      console.warn('[Events] startBreakBtn not found');
    }
    
    // Click anywhere on timer area to show UI when hidden
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) {
      timerContainer.addEventListener('click', (e) => {
        if (this.isRunning && this.uiHidden) {
          e.stopPropagation();
          console.log('[Events] timerContainer clicked (showing UI)');
          this.showUI();
        }
      });
      console.log('[Events] timerContainer click listener attached');
    } else {
      console.warn('[Events] timerContainer not found');
    }
    
    // Also allow clicking anywhere on the container/glass-card when UI is hidden
    const glassCard = document.querySelector('.glass-card');
    if (glassCard) {
      glassCard.addEventListener('click', (e) => {
        if (this.isRunning && this.uiHidden) {
          e.stopPropagation();
          console.log('[Events] glassCard clicked (showing UI)');
          this.showUI();
        }
      });
      console.log('[Events] glassCard click listener attached');
    } else {
      console.warn('[Events] glassCard not found');
    }
    
    // Click overlay to close settings
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'settingsOverlay') {
        console.log('[Events] settingsOverlay clicked (closing settings)');
        this.closeSettings();
      }
    });
    console.log('[Events] settingsOverlay click listener attached');
    
    // Show UI on mouse movement when timer is running
    document.addEventListener('mousemove', () => {
      if (this.isRunning && this.uiHidden) {
        console.log('[Events] mousemove detected (showing UI)');
        this.showUI();
        this.scheduleUIHide();
      }
    });
    console.log('[Events] mousemove listener attached');
    
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
        console.log('[Events] Double-tap prevented');
      }
      lastTouchEnd = now;
    }, false);
    console.log('[Events] touchend listener attached');
    
    console.log('[Events] All event listeners attached successfully');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return formatted;
  }

  updateDisplay() {
    console.log('[Display] updateDisplay() called - timeLeft:', this.timeLeft, '| isRunning:', this.isRunning, '| isBreak:', this.isBreak);
    const timeDisplay = document.getElementById('timeDisplay');
    const statusIcon = document.getElementById('statusIcon');
    const progressCircle = document.querySelector('.progress-ring-circle');
    
    if (timeDisplay) {
      const formattedTime = this.formatTime(this.timeLeft);
      timeDisplay.textContent = formattedTime;
      console.log('[Display] Updated timeDisplay to:', formattedTime);
      timeDisplay.style.transform = 'scale(1)';
      setTimeout(() => {
        timeDisplay.style.transform = 'scale(1)';
      }, 100);
    } else {
      console.warn('[Display] timeDisplay element not found');
    }

    // Show/hide status icon (play when running, pause when paused)
    if (statusIcon) {
      if (this.isRunning && this.timeLeft > 0) {
        statusIcon.textContent = '▶';
        statusIcon.style.display = 'block';
        statusIcon.className = 'status-icon play-icon';
        console.log('[Display] Status icon set to play (▶)');
      } else if (!this.isRunning && this.timeLeft > 0) {
        statusIcon.textContent = '⏸';
        statusIcon.style.display = 'block';
        statusIcon.className = 'status-icon pause-icon';
        console.log('[Display] Status icon set to pause (⏸)');
      } else {
        statusIcon.style.display = 'none';
        console.log('[Display] Status icon hidden');
      }
    } else {
      console.warn('[Display] statusIcon element not found');
    }

    // Update progress ring
    if (progressCircle) {
      // Get the radius from the circle element
      const isMobile = window.innerWidth <= 640;
      const progressRing = progressCircle.closest('.progress-ring');
      
      // Update SVG circle coordinates for mobile
      if (isMobile && progressRing) {
        const circles = progressRing.querySelectorAll('circle');
        circles.forEach(circle => {
          circle.setAttribute('r', '150');
          circle.setAttribute('cx', '160');
          circle.setAttribute('cy', '160');
        });
        progressRing.setAttribute('viewBox', '0 0 320 320');
        progressRing.setAttribute('width', '320');
        progressRing.setAttribute('height', '320');
      } else if (progressRing) {
        const circles = progressRing.querySelectorAll('circle');
        circles.forEach(circle => {
          circle.setAttribute('r', '130');
          circle.setAttribute('cx', '140');
          circle.setAttribute('cy', '140');
        });
        progressRing.setAttribute('viewBox', '0 0 280 280');
        progressRing.setAttribute('width', '280');
        progressRing.setAttribute('height', '280');
      }
      
      // Calculate radius based on actual circle element
      let radius = 130; // default desktop
      if (progressRing && isMobile) {
        radius = 150; // mobile
      }
      const circumference = 2 * Math.PI * radius;
      
      // Calculate total duration (original + any extensions)
      // For simplicity, we'll use the original duration as base
      const baseDuration = this.isBreak ? this.breakDuration : this.sessionDuration;
      
      // Calculate progress (ensure it doesn't exceed 1)
      const progress = Math.max(0, Math.min(1, 1 - (this.timeLeft / baseDuration)));
      const offset = circumference * progress;
      progressCircle.style.strokeDashoffset = offset;
      
      // Update stroke-dasharray
      progressCircle.setAttribute('stroke-dasharray', circumference.toString());
      console.log('[Display] Progress ring updated - progress:', (progress * 100).toFixed(1) + '%', '| offset:', offset.toFixed(2), '| baseDuration:', baseDuration, '| radius:', radius);
    } else {
      console.warn('[Display] progressCircle element not found');
    }

    // Update session indicator
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach(ind => {
      const type = ind.dataset.type;
      if ((type === 'session' && !this.isBreak) || (type === 'break' && this.isBreak)) {
        ind.classList.add('active');
        console.log('[Display] Indicator activated:', type);
      } else {
        ind.classList.remove('active');
      }
    });

    // Update button text
    const startPauseBtn = document.getElementById('startPauseBtn');
    if (startPauseBtn) {
      const btnText = startPauseBtn.querySelector('.btn-text');
      const newText = this.isRunning ? 'Pause' : 'Start';
      btnText.textContent = newText;
      console.log('[Display] Button text updated to:', newText);
    } else {
      console.warn('[Display] startPauseBtn not found');
    }

    // Update CTA buttons visibility (show even when UI is hidden)
    const ctaButtons = document.querySelector('.cta-buttons');
    if (ctaButtons) {
      if (this.showingCTAs) {
        ctaButtons.classList.remove('hidden');
        console.log('[Display] CTA buttons shown');
      } else {
        ctaButtons.classList.add('hidden');
        console.log('[Display] CTA buttons hidden');
      }
    } else {
      console.warn('[Display] ctaButtons not found');
    }

    // Hide regular controls when showing CTAs
    const controls = document.querySelector('.controls');
    if (controls) {
      if (this.showingCTAs) {
        controls.classList.add('hidden');
        console.log('[Display] Regular controls hidden (CTAs showing)');
      } else if (!this.uiHidden) {
        controls.classList.remove('hidden');
        console.log('[Display] Regular controls shown');
      }
    } else {
      console.warn('[Display] controls not found');
    }
    
    // Update UI visibility
    this.updateUIVisibility();
    console.log('[Display] Display update complete');
  }


  toggleTimer() {
    console.log('[Timer] toggleTimer() called - current state: isRunning:', this.isRunning, '| timeLeft:', this.timeLeft);
    if (this.isRunning) {
      console.log('[Timer] Timer is running, pausing...');
      this.pauseTimer();
    } else {
      console.log('[Timer] Timer is not running, starting...');
      this.startTimer();
    }
  }

  startTimer() {
    console.log('[Timer] startTimer() called - timeLeft:', this.timeLeft, '| isBreak:', this.isBreak);
    if (this.timeLeft <= 0) {
      console.log('[Timer] Timer at 0, resetting before start');
      this.resetTimer();
      return;
    }

    this.isRunning = true;
    console.log('[State Change] isRunning:', true, '| isBreak:', this.isBreak, '| timeLeft:', this.timeLeft);
    
    // Hide UI when starting timer, then schedule auto-hide after 10 seconds
    console.log('[Timer] Hiding UI and scheduling auto-hide');
    this.hideUI();
    this.scheduleUIHide();
    
    console.log('[Timer] Starting interval timer (1000ms)');
    this.intervalId = setInterval(() => {
      const oldTimeLeft = this.timeLeft;
      this.timeLeft--;
      // Only log every 10 seconds to avoid console spam, or when reaching milestones
      if (this.timeLeft % 10 === 0 || this.timeLeft === 0 || (oldTimeLeft > 60 && this.timeLeft <= 60)) {
        console.log('[State Change] timeLeft:', oldTimeLeft, '->', this.timeLeft, '| isBreak:', this.isBreak, '| isRunning:', this.isRunning);
      }

      if (this.timeLeft <= 0) {
        console.log('[Timer] Timer reached 0, completing session');
        // Clear interval immediately to prevent any race conditions
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        this.completeSession();
        return; // Exit early to avoid calling updateDisplay()
      }
      
      this.updateDisplay();
    }, 1000);

    this.updateDisplay();
    console.log('[Timer] Timer started successfully, intervalId:', this.intervalId);
  }

  pauseTimer() {
    console.log('[Timer] pauseTimer() called');
    this.isRunning = false;
    console.log('[State Change] isRunning:', false, '| isBreak:', this.isBreak, '| timeLeft:', this.timeLeft);
    if (this.intervalId) {
      console.log('[Timer] Clearing interval, intervalId:', this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    } else {
      console.log('[Timer] No interval to clear');
    }
    // Clear any pending hide timeout
    this.clearHideUITimeout();
    // Show UI when pausing
    console.log('[Timer] Showing UI after pause');
    this.showUI();
    this.updateDisplay();
    console.log('[Timer] Timer paused successfully');
  }

  extendTimer() {
    console.log('[Timer] extendTimer() called - adding 5 minutes');
    // Can extend anytime during a session
    const oldTimeLeft = this.timeLeft;
    this.timeLeft += 5 * 60; // Add 5 minutes
    console.log('[State Change] timeLeft:', oldTimeLeft, '->', this.timeLeft, '| isBreak:', this.isBreak, '| isRunning:', this.isRunning);
    console.log('[Timer] Extended by 300 seconds (5 minutes)');
      
    // Animate the extension
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      console.log('[Timer] Animating time display');
      timeDisplay.style.transform = 'scale(1.1)';
      setTimeout(() => {
        timeDisplay.style.transform = 'scale(1)';
      }, 200);
    }
    
    // Visual feedback
    const extendBtn = document.getElementById('extendBtn');
    if (extendBtn) {
      console.log('[Timer] Animating extend button');
      extendBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        extendBtn.style.transform = 'scale(1)';
      }, 150);
    }
    
    this.updateDisplay();
    console.log('[Timer] Timer extended successfully');
  }

  resetTimer() {
    console.log('[Timer] resetTimer() called');
    this.pauseTimer();
    const oldIsBreak = this.isBreak;
    const oldTimeLeft = this.timeLeft;
    const oldShowingCTAs = this.showingCTAs;
    this.isBreak = false;
    this.timeLeft = this.sessionDuration;
    this.showingCTAs = false;
    console.log('[State Change] resetTimer - isBreak:', oldIsBreak, '->', false, '| timeLeft:', oldTimeLeft, '->', this.timeLeft, '| showingCTAs:', oldShowingCTAs, '->', false);
    console.log('[Timer] Reset to work session, duration:', this.sessionDuration, 'seconds');
    this.showUI();
    this.updateDisplay();
    console.log('[Timer] Timer reset successfully');
  }

  completeSession() {
    console.log('[Timer] completeSession() called - isBreak:', this.isBreak, '| timeLeft:', this.timeLeft);
    // Set isRunning to false and clear interval if not already cleared
    this.isRunning = false;
    if (this.intervalId) {
      console.log('[Timer] Clearing interval in completeSession, intervalId:', this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Clear any pending hide timeout
    this.clearHideUITimeout();
    // Show UI when completing
    console.log('[Timer] Showing UI after completion');
    this.showUI();
    
    // Play completion sound (Safari-compatible)
    console.log('[Timer] Playing completion sound');
    this.playCompletionSound();
    
    // If work session completed, show CTAs (keep UI hidden)
    if (!this.isBreak) {
      console.log('[Timer] Work session completed, showing CTAs');
      const oldShowingCTAs = this.showingCTAs;
      this.showingCTAs = true;
      console.log('[State Change] completeSession (work) - showingCTAs:', oldShowingCTAs, '->', true, '| isBreak:', this.isBreak, '| timeLeft:', this.timeLeft);
      // Keep UI hidden, just show CTAs
      this.updateDisplay();
      
      // Visual feedback - pulse animation after display update
      // Use setTimeout to ensure display update is complete before animating
      setTimeout(() => {
        const glassCard = document.querySelector('.glass-card');
        if (glassCard) {
          console.log('[Timer] Adding pulse animation to glass-card');
          // Use animation-name to preserve other animation properties
          glassCard.style.animationName = 'pulse';
          glassCard.style.animationDuration = '0.5s';
          glassCard.style.animationTimingFunction = 'ease-in-out';
          // Clear animation after it completes (500ms) plus a small buffer
          setTimeout(() => {
            glassCard.style.animationName = '';
            glassCard.style.animationDuration = '';
            glassCard.style.animationTimingFunction = '';
            console.log('[Timer] Pulse animation removed');
          }, 600);
        }
      }, 50);
    } else {
      // Break completed, go back to work session
      console.log('[Timer] Break session completed, returning to work session');
      const oldIsBreak = this.isBreak;
      const oldTimeLeft = this.timeLeft;
      const oldShowingCTAs = this.showingCTAs;
      this.isBreak = false;
      this.timeLeft = this.sessionDuration;
      this.showingCTAs = false;
      console.log('[State Change] completeSession (break) - isBreak:', oldIsBreak, '->', false, '| timeLeft:', oldTimeLeft, '->', this.timeLeft, '| showingCTAs:', oldShowingCTAs, '->', false);
      this.updateDisplay();
    }
    console.log('[Timer] Session completion handled');
  }

  addTimeFromCTA() {
    console.log('[CTA] addTimeFromCTA() called');
    // Add 5 minutes to work session
    const oldTimeLeft = this.timeLeft;
    const oldShowingCTAs = this.showingCTAs;
    this.timeLeft = 5 * 60; // 5 minutes
    this.showingCTAs = false;
    console.log('[State Change] addTimeFromCTA - timeLeft:', oldTimeLeft, '->', this.timeLeft, '| showingCTAs:', oldShowingCTAs, '->', false);
    console.log('[CTA] Set timer to 5 minutes (300 seconds)');
    this.updateDisplay();
    console.log('[CTA] Time added from CTA successfully');
  }

  startBreakFromCTA() {
    console.log('[CTA] startBreakFromCTA() called');
    // Start break session and auto-start timer
    const oldIsBreak = this.isBreak;
    const oldTimeLeft = this.timeLeft;
    const oldShowingCTAs = this.showingCTAs;
    this.isBreak = true;
    this.timeLeft = this.breakDuration;
    this.showingCTAs = false;
    console.log('[State Change] startBreakFromCTA - isBreak:', oldIsBreak, '->', true, '| timeLeft:', oldTimeLeft, '->', this.timeLeft, '| showingCTAs:', oldShowingCTAs, '->', false);
    console.log('[CTA] Starting break session, duration:', this.breakDuration, 'seconds');
    this.updateDisplay();
    // Auto-start the break timer
    console.log('[CTA] Auto-starting break timer');
    this.startTimer();
    console.log('[CTA] Break started from CTA successfully');
  }

  playCompletionSound() {
    console.log('[Audio] playCompletionSound() called');
    // Create a simple beep using Web Audio API (Safari compatible)
    try {
      console.log('[Audio] Creating AudioContext');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      console.log('[Audio] Connecting audio nodes');
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      console.log('[Audio] Oscillator configured - frequency: 800Hz, type: sine');

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      console.log('[Audio] Gain configured - start: 0.3, end: 0.01, duration: 0.5s');

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      console.log('[Audio] Sound playback started, will stop in 0.5s');
    } catch (e) {
      console.error('[Audio] Error playing sound:', e);
      console.log('[Audio] Audio not available');
    }
  }

  hideUI() {
    console.log('[UI] hideUI() called');
    const oldUiHidden = this.uiHidden;
    this.uiHidden = true;
    console.log('[State Change] uiHidden:', oldUiHidden, '->', true);
    this.updateUIVisibility();
    console.log('[UI] UI hidden');
  }

  showUI() {
    console.log('[UI] showUI() called');
    const oldUiHidden = this.uiHidden;
    this.uiHidden = false;
    console.log('[State Change] uiHidden:', oldUiHidden, '->', false);
    this.updateUIVisibility();
    console.log('[UI] UI shown');
  }

  toggleUIVisibility() {
    console.log('[UI] toggleUIVisibility() called - current state:', this.uiHidden);
    const oldUiHidden = this.uiHidden;
    this.uiHidden = !this.uiHidden;
    console.log('[State Change] uiHidden:', oldUiHidden, '->', this.uiHidden);
    this.updateUIVisibility();
    console.log('[UI] UI visibility toggled');
  }

  scheduleUIHide() {
    console.log('[UI] scheduleUIHide() called - isRunning:', this.isRunning);
    // Clear any existing timeout
    this.clearHideUITimeout();
    
    // Only schedule if timer is running
    if (this.isRunning) {
      console.log('[UI] Scheduling UI hide in 2000ms');
      this.hideUITimeout = setTimeout(() => {
        console.log('[UI] Scheduled UI hide timeout fired');
        if (this.isRunning) {
          this.hideUI();
        } else {
          console.log('[UI] Timer not running, canceling scheduled hide');
        }
      }, 2000); // 2 seconds
    } else {
      console.log('[UI] Timer not running, not scheduling UI hide');
    }
  }

  clearHideUITimeout() {
    if (this.hideUITimeout) {
      console.log('[UI] clearHideUITimeout() called - clearing timeout:', this.hideUITimeout);
      clearTimeout(this.hideUITimeout);
      this.hideUITimeout = null;
      console.log('[UI] UI hide timeout cleared');
    } else {
      console.log('[UI] clearHideUITimeout() called - no timeout to clear');
    }
  }

  updateUIVisibility() {
    console.log('[UI] updateUIVisibility() called - uiHidden:', this.uiHidden);
    const container = document.querySelector('.container');
    const headerTop = document.querySelector('.header-top');
    
    if (this.uiHidden) {
      if (container) {
        container.classList.add('ui-hidden');
        console.log('[UI] Added ui-hidden class to container');
      } else {
        console.warn('[UI] Container element not found');
      }
      if (headerTop) {
        headerTop.classList.add('hidden');
        console.log('[UI] Added hidden class to header-top');
      } else {
        console.warn('[UI] header-top element not found');
      }
    } else {
      if (container) {
        container.classList.remove('ui-hidden');
        console.log('[UI] Removed ui-hidden class from container');
      } else {
        console.warn('[UI] Container element not found');
      }
      if (headerTop) {
        headerTop.classList.remove('hidden');
        console.log('[UI] Removed hidden class from header-top');
      } else {
        console.warn('[UI] header-top element not found');
      }
    }
  }

  openSettings() {
    console.log('[Settings] openSettings() called');
    const oldSettingsOpen = this.settingsOpen;
    this.settingsOpen = true;
    console.log('[State Change] settingsOpen:', oldSettingsOpen, '->', true);
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
      overlay.classList.add('open');
      console.log('[Settings] Settings overlay opened');
    } else {
      console.error('[Settings] Settings overlay element not found');
    }
  }

  closeSettings() {
    console.log('[Settings] closeSettings() called');
    const oldSettingsOpen = this.settingsOpen;
    this.settingsOpen = false;
    console.log('[State Change] settingsOpen:', oldSettingsOpen, '->', false);
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      console.log('[Settings] Settings overlay closed');
    } else {
      console.error('[Settings] Settings overlay element not found');
    }
  }

  saveSettings() {
    console.log('[Settings] saveSettings() called');
    const sessionInput = document.getElementById('sessionDuration');
    const breakInput = document.getElementById('breakDuration');
    
    if (!sessionInput || !breakInput) {
      console.error('[Settings] Input elements not found');
      return;
    }
    
    const sessionMinutes = parseFloat(sessionInput.value) || 0.1;
    const breakMinutes = parseFloat(breakInput.value) || 0.1;
    console.log('[Settings] Parsed values - sessionMinutes:', sessionMinutes, '| breakMinutes:', breakMinutes);
    
    // Validate (allow decimals down to 0.1 minutes = 6 seconds for testing)
    if (sessionMinutes < 0.1 || sessionMinutes > 60 || breakMinutes < 0.1 || breakMinutes > 30) {
      console.warn('[Settings] Validation failed - sessionMinutes:', sessionMinutes, '| breakMinutes:', breakMinutes);
      alert('Please enter valid durations (Work: 0.1-60 min, Break: 0.1-30 min)');
      return;
    }
    
    // Save to localStorage
    const settings = {
      sessionDuration: sessionMinutes,
      breakDuration: breakMinutes
    };
    console.log('[Settings] Saving to localStorage:', JSON.stringify(settings));
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    console.log('[Settings] Settings saved to localStorage successfully');
    
    // Update current values (convert minutes to seconds)
    const oldSessionDuration = this.sessionDuration;
    const oldBreakDuration = this.breakDuration;
    this.sessionDuration = Math.round(sessionMinutes * 60);
    this.breakDuration = Math.round(breakMinutes * 60);
    console.log('[State Change] saveSettings - sessionDuration:', oldSessionDuration, '->', this.sessionDuration, '| breakDuration:', oldBreakDuration, '->', this.breakDuration);
    
    // Reset timer if not running
    if (!this.isRunning) {
      console.log('[Settings] Timer not running, updating timeLeft');
      if (!this.isBreak) {
        this.timeLeft = this.sessionDuration;
        console.log('[Settings] Updated timeLeft to sessionDuration:', this.timeLeft);
      } else {
        this.timeLeft = this.breakDuration;
        console.log('[Settings] Updated timeLeft to breakDuration:', this.timeLeft);
      }
      this.updateDisplay();
    } else {
      console.log('[Settings] Timer is running, not updating timeLeft');
    }
    
    this.closeSettings();
    console.log('[Settings] Settings saved successfully');
  }
}

// Initialize app when DOM is ready
console.log('[App] Script loaded, document.readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[App] DOM still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOMContentLoaded fired, initializing PomodoroTimer');
    new PomodoroTimer();
  });
} else {
  console.log('[App] DOM already ready, initializing PomodoroTimer immediately');
  new PomodoroTimer();
}

