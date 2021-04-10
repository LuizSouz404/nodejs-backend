import { Router } from 'express';
import { UserController } from './controllers/UserController';
import ensureAuth from './middlewares/ensureAuth';

const router = Router();

const userController = new UserController();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/reset-password', userController.sendMail);
router.put('/reset-password/:token', userController.changePass);
router.delete('/cancel-account', ensureAuth, userController.delete);
router.get('/search', userController.findAll);
router.get('/search/:id', userController.findOne);

export { router };
