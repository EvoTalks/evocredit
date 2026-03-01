import express from 'express';
import dotenv from 'dotenv';
import userRoute from './http/routes/user-route';
import webhookRoute from './http/routes/webhook-route';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', (req, res) => {
  res.status(200).json({
    msg: 'Server is up and running',
  });
});

app.use(userRoute);
app.use(webhookRoute);

export default app;
