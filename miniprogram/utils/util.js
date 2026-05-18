function formatTime(timestamp) {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getHourMark() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

module.exports = { formatTime, getHourMark };
