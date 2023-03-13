const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const morgan = require("morgan");
const compression = require('compression')

const path = require('path')
const cors = require('cors')
const app = express();
const auth = require('./routes/auth')
const dump = require('./routes/dump')
const newsfeed = require('./routes/newsfeed');
const collectionPoint = require('./routes/collectionPoint');
const item = require('./routes/item');
const dashboard = require('./routes/dashboard');
const chat = require('./routes/chat');
const feedback = require('./routes/feedback');
const errorMiddleware = require('./middlewares/errors')

app.use(compression())
app.use(morgan('tiny'));
app.use(express.json());
app.use(cors())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, access-control-allow-origin, token");
  next();
});

app.get('/api/test', (req, res) => {
  res.send('congrats');
})

app.use('/api/v1', cors(), auth);
app.use('/api/v1', cors(), dump);
app.use('/api/v1',newsfeed);
app.use('/api/v1',collectionPoint);
app.use('/api/v1',item);
app.use('/api/v1', dashboard);
app.use('/api/v1',chat);
app.use('/api/v1',feedback);


// if (process.env.NODE_ENV !== 'PRODUCTION') 
//       require('dotenv').config({ path: '/config/config.env' })


//     if (process.env.NODE_ENV === 'PRODUCTION') {
//     app.use(express.static(path.join(__dirname, '../frontend/build')))

//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
//     })
// }


app.use(errorMiddleware);


module.exports = app