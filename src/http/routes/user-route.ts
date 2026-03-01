import { Router } from 'express';
import { userController } from '../controllers/user-controller';
import { getUserByEmailController } from '../controllers/get-user-by-email-controller';
import { getUsersController } from '../controllers/get-users-controller';
import { addCreditsController } from '../controllers/add-credits-controller';

const userRoute = Router();

userRoute.post('/users', userController);
userRoute.get('/users', getUsersController);
userRoute.get('/users/by-email', getUserByEmailController);
userRoute.post('/users/credits', addCreditsController);

export default userRoute;
