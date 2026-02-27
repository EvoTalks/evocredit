import app from './app';
import { env } from './env';

const PORT = env.API_PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
