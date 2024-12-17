const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const vlogRoutes = require('./routes/vlogRoutes');
const tourRoutes = require('./routes/tourRoutes');
const tourMessageRoutes = require('./routes/tourMessageRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();


app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


const corsOptions = {
  origin: [ 'http://localhost:3000','https://travelapp-itpa.onrender.com'],
  credentials: true,
/*   allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST'],
  secure: true,
  sameSite: 'none',
  domain:  '.onrender.com'  */
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path); // Validate URL encoding
    next(); // Proceed if valid
  } catch (error) {
    console.error('Invalid URL:', req.path, error.message);
    res.status(400).send('Bad Request: Invalid URL'); // Custom response
  }
});

app.use(authRoutes,messageRoutes,vlogRoutes,tourRoutes,tourMessageRoutes,adminRoutes);



const PORT = process.env.PORT || 5252;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
