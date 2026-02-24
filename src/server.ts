import app from './app';

const PORT = process.env.PORT || 3333;

app.listen(3333, '0.0.0.0', () => {
  console.log(`Server is running`);
});
