const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { parser } = require('./api/parser')
const { taskList } = require('./api/taskList')
const {resultWebAnalysisList} = require('./api/testdomResult')

require('dotenv').config();

const middlewares = require('./middlewares');

const app = express();
//setting view engine to ejs
// app.set("view engine", "ejs");

app.use(morgan('dev'));
// app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

// app.get('/', (req, res) => {
//   parser(req.query);
// });

app.get('/api/getTask', (req, res) => {
  res.json(taskList);
})

app.get('/api/queryResult', (req, res) => {
  res.json(resultWebAnalysisList[req.query.id])
})

app.get('/api/debug', (req, res) => {
  parser(req.query);
})

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
