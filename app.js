const metricEpisode = document.getElementById("metric-episode");
const metricReward = document.getElementById("metric-reward");
const metricSuccess = document.getElementById("metric-success");
const metricLoss = document.getElementById("metric-loss");
const rewardChart = document.getElementById("reward-chart");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const targetReward = document.getElementById("target-reward");
const targetRewardValue = document.getElementById("target-reward-value");
const syncButton = document.getElementById("sync-btn");
const timeline = document.getElementById("timeline");
const timelineValue = document.getElementById("timeline-value");
const playButton = document.getElementById("play-btn");
const pauseButton = document.getElementById("pause-btn");
const resetButton = document.getElementById("reset-btn");
const trajectoryCanvas = document.getElementById("trajectory-canvas");

const rewardCtx = rewardChart.getContext("2d");
const trajectoryCtx = trajectoryCanvas.getContext("2d");

const rewardHistory = Array.from({ length: 30 }, () => 120 + Math.random() * 40);
let episode = 0;
let playing = false;
let timelineValueInternal = 0;
let trajectoryTimer = null;

function drawRewardChart() {
  const width = rewardChart.width;
  const height = rewardChart.height;
  rewardCtx.clearRect(0, 0, width, height);
  rewardCtx.lineWidth = 2;
  rewardCtx.strokeStyle = "#4f6eff";
  rewardCtx.beginPath();
  rewardHistory.forEach((value, index) => {
    const x = (index / (rewardHistory.length - 1)) * width;
    const y = height - (value / 300) * height;
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
  const avgReward = rewardHistory[rewardHistory.length - 1];
  const successRate = Math.min(100, 40 + episode * 0.6 + Math.random() * 10);
  const loss = Math.max(0.05, 1.2 - episode * 0.01 + Math.random() * 0.2);

  metricEpisode.textContent = episode;
  metricReward.textContent = avgReward.toFixed(1);
  metricSuccess.textContent = `${successRate.toFixed(1)}%`;
  metricLoss.textContent = loss.toFixed(3);
}

function pushReward() {
  const target = Number(targetReward.value);
  const last = rewardHistory[rewardHistory.length - 1];
  const next = last + (target - last) * 0.05 + (Math.random() * 8 - 4);
  rewardHistory.push(Math.min(300, Math.max(0, next)));
  rewardHistory.shift();
}

function drawTrajectory(progress) {
  const width = trajectoryCanvas.width;
  const height = trajectoryCanvas.height;
  trajectoryCtx.clearRect(0, 0, width, height);

  trajectoryCtx.strokeStyle = "#dfe4f4";
  trajectoryCtx.lineWidth = 1;
  for (let i = 40; i < width; i += 80) {
    trajectoryCtx.beginPath();
    trajectoryCtx.moveTo(i, 0);
    trajectoryCtx.lineTo(i, height);
    trajectoryCtx.stroke();
  }

  trajectoryCtx.strokeStyle = "#4f6eff";
  trajectoryCtx.lineWidth = 3;
  trajectoryCtx.beginPath();
  const points = 20;
  for (let i = 0; i <= points; i += 1) {
    const x = (i / points) * width;
    const y = height * 0.5 + Math.sin(i / 2) * 60;
    if (i === 0) {
      trajectoryCtx.moveTo(x, y);
    } else {
      trajectoryCtx.lineTo(x, y);
    }
  }
  trajectoryCtx.stroke();

  const agentX = (progress / 100) * width;
  const agentY = height * 0.5 + Math.sin((progress / 100) * points / 2) * 60;
  trajectoryCtx.fillStyle = "#ff8a00";
  trajectoryCtx.beginPath();
  trajectoryCtx.arc(agentX, agentY, 10, 0, Math.PI * 2);
  trajectoryCtx.fill();
}

function setStatus(isRunning) {
  statusDot.style.background = isRunning ? "#4caf50" : "#f39c12";
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

setInterval(() => {
  pushReward();
  drawRewardChart();
  updateMetrics();
}, 1400);

syncButton.addEventListener("click", syncParameters);

if (targetReward) {
  targetReward.addEventListener("input", (event) => {
    targetRewardValue.textContent = event.target.value;
  });
}

timeline.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  timelineValueInternal = value;
  updateTimeline(value);
});

playButton.addEventListener("click", startPlayback);
pauseButton.addEventListener("click", pausePlayback);
resetButton.addEventListener("click", resetPlayback);

setStatus(true);
updateTimeline(0);
drawRewardChart();
updateMetrics();
