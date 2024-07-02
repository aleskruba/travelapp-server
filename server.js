const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');


dotenv.config();

//console.log(`Connecting to Redis at 127.0.0.1:6379`);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


const corsOptions = {
  origin: [ 'http://localhost:3000','https://travelapp-server.onrender.com'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(authRoutes);




const PORT = process.env.PORT || 5252;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
