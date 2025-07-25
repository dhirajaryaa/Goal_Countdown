document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("goal-form");
  const goalDisplay = document.getElementById("goalDisplay");
  const countdownEl = document.getElementById("countdown");
  const gridEl = document.getElementById("grid");
  const progressDisplay = document.getElementById("progressDisplay");
  const hamburger = document.getElementById("hamburger");
  const quoteEl = document.getElementById("quote");

  let cells = [];
  let totalCells = 0;
  let countdownInterval;
  let gridInterval;

  const pad = (val, len = 2) => String(val).padStart(len, "0");

  async function loadQuotes() {
    try {
      const response = await fetch(chrome.runtime.getURL("quotes.json"));
      const data = await response.json();
      return data.quotes;
    } catch (error) {
      console.error("Failed to load quotes:", error);
      return ["Stay strong! (fallback quote)"];
    }
  }

  function showRandomQuote(quotes) {
    if (quoteEl) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      quoteEl.textContent = quotes[randomIndex];
    }
  }

  function buildGrid() {
    const cellSize = 15;
    const gapSize = 4;
    const totalCols = Math.floor(window.innerWidth / (cellSize + gapSize));
    const totalRows = Math.floor(window.innerHeight / (cellSize + gapSize));
    totalCells = totalCols * totalRows;

    gridEl.style.gridTemplateColumns = `repeat(${totalCols}, ${cellSize}px)`;
    gridEl.innerHTML = "";
    cells = [];

    for (let i = 0; i < totalCells; i++) {
      const div = document.createElement("div");
      gridEl.appendChild(div);
      cells.push(div);
    }
  }

  function updateCountdown(targetTime) {
    const now = new Date();
    const timeLeft = new Date(targetTime) - now;

    const years = Math.floor(timeLeft / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((timeLeft / (1000 * 60 * 60 * 24 * 30.44)) % 12);
    const days = Math.floor((timeLeft / (1000 * 60 * 60 * 24)) % 30.44);
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    const ms = Math.floor(timeLeft % 1000);

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = pad(val, id === "ms" ? 3 : 2);
    };

    setText("years", years);
    setText("months", months);
    setText("days", days);
    setText("hours", hours);
    setText("minutes", minutes);
    setText("seconds", seconds);
    setText("ms", ms);
  }

  function updateGrid(targetTime) {
    const startTime = new Date(localStorage.getItem("startTime"));
    const now = new Date();
    const totalDuration = new Date(targetTime) - startTime;
    const timePassed = Math.max(0, now - startTime);
    const percentPassed = Math.min(1, timePassed / totalDuration);
    const filled = Math.floor(percentPassed * totalCells);

    cells.forEach((cell, i) => {
      cell.classList.toggle("filled", i < filled);
    });

    if (progressDisplay) {
      progressDisplay.textContent = `Progress: ${(percentPassed * 100).toFixed(2)}%`;
    }
  }

  function startCountdown(goal, targetTime) {
    buildGrid();
    updateCountdown(targetTime);
    updateGrid(targetTime);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => updateCountdown(targetTime), 10);

    clearInterval(gridInterval);
    gridInterval = setInterval(() => updateGrid(targetTime), 5 * 60 * 1000);
  }

  // Load saved data
  const savedGoal = localStorage.getItem("goal");
  const savedTarget = localStorage.getItem("target");
  const savedStart = localStorage.getItem("startTime");

  if (savedGoal && savedTarget && savedStart) {
    if (form) form.style.display = "none";
    if (goalDisplay) {
      goalDisplay.style.display = "inline-block";
      goalDisplay.textContent = `🎯 ${savedGoal} by ${new Date(savedTarget).toDateString()}`;
    }
    if (countdownEl) countdownEl.style.display = "flex";
    startCountdown(savedGoal, savedTarget);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const goal = document.getElementById("goal").value;
      const target = document.getElementById("target").value;

      if (!goal || !target) return;

      localStorage.setItem("goal", goal);
      localStorage.setItem("target", target);
      localStorage.setItem("startTime", new Date().toISOString());

      form.style.display = "none";
      if (goalDisplay) {
        goalDisplay.style.display = "inline-block";
        goalDisplay.textContent = `🎯 ${goal}`;
      }
      if (countdownEl) countdownEl.style.display = "flex";
      startCountdown(goal, target);
    });
  }

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      if (form) {
        form.style.display = form.style.display === "flex" ? "none" : "flex";
      }
    });
  }

  window.addEventListener("resize", () => {
    const goal = localStorage.getItem("goal");
    const target = localStorage.getItem("target");
    if (goal && target) {
      startCountdown(goal, target);
    }
  });

  // Load quote on focus and initial load
  const quotes = await loadQuotes();
  showRandomQuote(quotes);

  window.addEventListener("focus", async () => {
    const quotes = await loadQuotes();
    showRandomQuote(quotes);
  });
});