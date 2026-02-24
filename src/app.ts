import express from 'express';
import dotenv from 'dotenv';
import userRoute from './http/routes/user-route';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api', (req, res) => {
  res.status(200).json({
    msg: 'Server is up and running',
  });
});

app.use(userRoute);

export default app;
