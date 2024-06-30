const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const bodyParser = require('body-parser');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
console.log(redis)
const authRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 5252;

app.use(express.json());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


const corsOptions = {
    origin: [process.env.DEV_CORS_ORIGIN , 'http://localhost:3000'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.get('/api', (req, res) => {
    res.send('server test');
  });
  

app.use(authRoutes);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
