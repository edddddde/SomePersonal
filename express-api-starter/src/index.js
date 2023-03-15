const app = require('./app');
const { scheduleTask } = require('./api/schedual')

const port = process.env.PORT || 5001;

(async () => {
  await scheduleTask();
})()

app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});