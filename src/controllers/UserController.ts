import path from 'path';
import { Request, Response } from 'express';
import { compare, hash } from 'bcrypt';
import { getCustomRepository } from 'typeorm';
import { UsersRepository } from '../repositories/UsersRepository';
import authConfig from '../config/authConfig';
import { sign } from 'jsonwebtoken';
import SendMailResetPass from '../service/SendMailResetPass';
import { randomBytes } from 'crypto';

class UserController {
  async register(request: Request, response: Response) {
    const { username, email, password } = request.body;

    console.log({ username, email, password });
    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await usersRepository.findOne({ email });

    if (userExists) {
      return response.status(400).json({
        error: 'This email already used',
      });
    }

    const passHashed = await hash(password, 8);

    const user = usersRepository.create({
      username,
      email,
      password: passHashed,
    });

    await usersRepository.save(user);

    return response.status(201).json(user);
  }

  async login(request: Request, response: Response) {
    const { email, password } = request.body;

    const userRepository = getCustomRepository(UsersRepository);

    const userAuth = await userRepository.findOne({ email });

    if (!userAuth) {
      return response.status(400).json({
        error: 'Email or password is wrong.',
      });
    }

    const decryptPass = await compare(password, userAuth.password);

    if (!decryptPass) {
      return response.status(400).json({
        error: 'Email or password is wrong.',
      });
    }

    const { expiresIn, secret } = authConfig.jwt;

    const token = sign({}, secret, {
      subject: userAuth.id,
      expiresIn,
    });

    delete userAuth.password;

    return response.json({
      user: userAuth,
      token,
    });
  }

  async sendMail(request: Request, response: Response) {
    const { email } = request.body;

    const userRepository = getCustomRepository(UsersRepository);

    const user = await userRepository.findOne({ email });

    if (!user) {
      return response.status(400).json({
        error: "User doesn't exists.",
      });
    }

    const token = randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpires = now;

    console.log(user.passwordResetToken, user.passwordResetExpires);

    const resetPath = path.resolve(
      __dirname,
      '..',
      'views',
      'emails',
      'resetPass.hbs'
    );

    const variables = {
      name: user.username,
      id: user.passwordResetToken,
      link: 'localhost:3333/reset-password',
    };

    await SendMailResetPass.execute(
      email,
      'Recuperar senha',
      variables,
      resetPath
    );

    await userRepository.save(user);

    return response.status(200).json({
      message: 'Email enviado!',
    });
  }

  async delete(request: Request, response: Response) {
    const { id } = request.user;

    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await usersRepository.findOne({ id });

    await usersRepository.remove(userExists);

    return response.status(201).json({
      message: 'Account has be deleted',
    });
  }

  async findAll(request: Request, response: Response) {
    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await usersRepository.find({});

    return response.status(201).json(userExists);
  }

  async findOne(request: Request, response: Response) {
    const { id } = request.params;

    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await usersRepository.findOne({ id });

    return response.status(201).json(userExists);
  }

  async changePass(request: Request, response: Response) {
    const { password } = request.body;
    const { token } = request.params;

    const userRepository = getCustomRepository(UsersRepository);

    const resetPassUser = await userRepository.findOne({
      passwordResetToken: token,
    });

    if (!resetPassUser) {
      return response.status(400).json({
        error: 'Invalid request',
      });
    }

    const now = new Date();
    now.getHours();

    if (resetPassUser.passwordResetExpires < now) {
      return response.status(400).json({
        error: 'Request expires.',
      });
    }

    const passHashed = await hash(password, 8);

    resetPassUser.password = passHashed;
    await userRepository.save(resetPassUser);

    return response.status(200).json({
      message: 'Password changed with success',
    });
  }
}

export { UserController };
