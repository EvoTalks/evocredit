import { Router } from 'express';
import { userController } from '../controllers/user-controller';
import { getUserByEmailController } from '../controllers/get-user-by-email-controller';
import { getUsersController } from '../controllers/get-users-controller';

const userRoute = Router();

userRoute.post('/users', userController);
userRoute.get('/users', getUsersController);
userRoute.get('/users/by-email', getUserByEmailController);

export default userRoute;
