const metricReward = document.getElementById("metric-reward");
const metricWin = document.getElementById("metric-win");
const metricLoss = document.getElementById("metric-loss");
const metricSteps = document.getElementById("metric-steps");
const metricTotalEpisodes = document.getElementById("metric-total-episodes");
const metricRound = document.getElementById("metric-round");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const statusEpisode = document.getElementById("status-episode");
const progressFill = document.getElementById("progress-fill");
const rewardChart = document.getElementById("reward-chart");
const rewardList = document.getElementById("reward-list");
const algoSelect = document.getElementById("algo-select");
const scenarioSelect = document.getElementById("scenario-select");
const paramAlgo = document.getElementById("param-algo");
const paramScenario = document.getElementById("param-scenario");
const syncButton = document.getElementById("sync-btn");
const timeline = document.getElementById("timeline");
const timelineValue = document.getElementById("timeline-value");
const playButton = document.getElementById("play-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");
const trajectoryCanvas = document.getElementById("trajectory-canvas");

const rewardCtx = rewardChart.getContext("2d");
const trajectoryCtx = trajectoryCanvas.getContext("2d");

const rewardHistory = Array.from({ length: 40 }, () => 120 + Math.random() * 40);
const rewardWeights = [0.1, 0.2, 0.3, 0.4];
let episode = 0;
let steps = 0;
let totalEpisodes = 0;
let round = 1;
let playing = false;
let timelineValueInternal = 0;
let trajectoryTimer = null;

function renderRewardWeights() {
  rewardList.innerHTML = "";
  rewardWeights.forEach((weight, index) => {
    const item = document.createElement("div");
    item.className = "reward-item";
    item.innerHTML = `
      <div class="reward-meta">
        <span class="label">奖励 ${index + 1}</span>
        <strong>${weight.toFixed(2)}</strong>
      </div>
      <div class="reward-bar"><span style="width: ${weight * 100}%"></span></div>
      <small>${(weight * 100).toFixed(0)}%</small>
    `;
    rewardList.appendChild(item);
  });
}

function drawRewardChart() {
  const width = rewardChart.width;
  const height = rewardChart.height;
  rewardCtx.clearRect(0, 0, width, height);

  rewardCtx.strokeStyle = "#dfe4f4";
  rewardCtx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = (i / 5) * height;
    rewardCtx.beginPath();
    rewardCtx.moveTo(0, y);
    rewardCtx.lineTo(width, y);
    rewardCtx.stroke();
  }

  rewardCtx.lineWidth = 2;
  rewardCtx.strokeStyle = "#4f6eff";
  rewardCtx.beginPath();
  rewardHistory.forEach((value, index) => {
    const x = (index / (rewardHistory.length - 1)) * width;
    const y = height - (value / 320) * height;
    if (index === 0) {
      rewardCtx.moveTo(x, y);
    } else {
      rewardCtx.lineTo(x, y);
    }
  });
  rewardCtx.stroke();
}

function updateMetrics() {
  episode += 1;
  steps = 100 + Math.floor(Math.random() * 50);
  totalEpisodes += 1;

  const avgReward = rewardHistory[rewardHistory.length - 1];
  const winRate = Math.min(100, 45 + totalEpisodes * 0.4 + Math.random() * 8);
  const loss = Math.max(0.05, 1.4 - totalEpisodes * 0.012 + Math.random() * 0.15);
  const progress = Math.min(100, (totalEpisodes % 200) / 2);

  metricReward.textContent = avgReward.toFixed(1);
  metricWin.textContent = `${winRate.toFixed(1)}%`;
  metricLoss.textContent = loss.toFixed(3);
  metricSteps.textContent = steps;
  metricTotalEpisodes.textContent = totalEpisodes;
  metricRound.textContent = `${round} / 10`;
  statusEpisode.textContent = `Episode #${episode}`;
  progressFill.style.width = `${progress}%`;

  if (progress === 0 && totalEpisodes > 0) {
    round = Math.min(10, round + 1);
  }
}

function pushReward() {
  const last = rewardHistory[rewardHistory.length - 1];
  const target = 180 + rewardWeights.reduce((sum, weight) => sum + weight * 60, 0);
  const next = last + (target - last) * 0.05 + (Math.random() * 10 - 5);
  rewardHistory.push(Math.min(320, Math.max(60, next)));
  rewardHistory.shift();
}

function drawTrajectory(progress) {
  const width = trajectoryCanvas.width;
  const height = trajectoryCanvas.height;
  trajectoryCtx.clearRect(0, 0, width, height);

  trajectoryCtx.strokeStyle = "#dfe4f4";
  trajectoryCtx.lineWidth = 1;
  for (let i = 40; i < width; i += 100) {
    trajectoryCtx.beginPath();
    trajectoryCtx.moveTo(i, 0);
    trajectoryCtx.lineTo(i, height);
    trajectoryCtx.stroke();
  }

  trajectoryCtx.strokeStyle = "#4f6eff";
  trajectoryCtx.lineWidth = 3;
  trajectoryCtx.beginPath();
  const points = 22;
  for (let i = 0; i <= points; i += 1) {
    const x = (i / points) * width;
    const y = height * 0.55 + Math.sin(i / 2.3) * 70;
    if (i === 0) {
      trajectoryCtx.moveTo(x, y);
    } else {
      trajectoryCtx.lineTo(x, y);
    }
  }
  trajectoryCtx.stroke();

  const agentX = (progress / 100) * width;
  const agentY = height * 0.55 + Math.sin((progress / 100) * points / 2.3) * 70;
  trajectoryCtx.fillStyle = "#ff8a00";
  trajectoryCtx.beginPath();
  trajectoryCtx.arc(agentX, agentY, 10, 0, Math.PI * 2);
  trajectoryCtx.fill();
}

function setStatus(isRunning) {
  statusDot.style.background = isRunning ? "#35c27a" : "#f39c12";
  statusText.textContent = isRunning ? "运行中" : "暂停";
}

function syncParameters() {
  statusText.textContent = "同步中...";
  statusDot.style.background = "#4f6eff";
  setTimeout(() => {
    setStatus(true);
  }, 600);
}

function updateTimeline(value) {
  timelineValue.textContent = `${value}%`;
  drawTrajectory(value);
}

function startPlayback() {
  if (playing) {
    return;
  }
  playing = true;
  setStatus(true);
  trajectoryTimer = setInterval(() => {
    timelineValueInternal = (timelineValueInternal + 1) % 101;
    timeline.value = timelineValueInternal;
    updateTimeline(timelineValueInternal);
  }, 80);
}

function pausePlayback() {
  playing = false;
  setStatus(false);
  clearInterval(trajectoryTimer);
}

function resetPlayback() {
  pausePlayback();
  timelineValueInternal = 0;
  timeline.value = 0;
  updateTimeline(0);
}

algoSelect.addEventListener("change", (event) => {
  paramAlgo.textContent = event.target.value;
});

scenarioSelect.addEventListener("change", (event) => {
  paramScenario.textContent = event.target.value;
});

syncButton.addEventListener("click", syncParameters);

setInterval(() => {
  pushReward();
  drawRewardChart();
  updateMetrics();
}, 1400);

timeline.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  timelineValueInternal = value;
  updateTimeline(value);
});

playButton.addEventListener("click", startPlayback);
pauseButton.addEventListener("click", pausePlayback);
resetButton.addEventListener("click", resetPlayback);

renderRewardWeights();
setStatus(true);
updateTimeline(0);
drawRewardChart();
updateMetrics();
