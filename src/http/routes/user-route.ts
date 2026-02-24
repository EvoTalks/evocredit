import { Router } from 'express';
import { userController } from '../controllers/user-controller';

const userRoute = Router();

userRoute.post('/users', userController);

export default userRoute;
