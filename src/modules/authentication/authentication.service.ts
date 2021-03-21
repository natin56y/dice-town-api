import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import RegisterDto from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  public async register(registrationData: RegisterDto) {
    
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    let newUser = new User()
    newUser.email = registrationData.email
    newUser.password = hashedPassword
    newUser.name = registrationData.name

    const createdUser = await this.usersService.save(newUser);
    if(!createdUser)
      throw new HttpException('User with that email already exists', HttpStatus.CONFLICT);

    createdUser.password = undefined;
    return createdUser;
}

  async login(user: User) {
    const payload = { name: user.name, id: user.id };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  public async getAuthenticatedUser(email: string, plainTextPassword: string): Promise<User> {
    try {
      const user = await (await this.usersService.find({email})).shift();
      await this.verifyPassword(plainTextPassword, user.password);
      return user;
    } catch (error) {
      throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST);
    }
  }

  private async verifyPassword(plainTextPassword: string, hashedPassword: string) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword
    );
    if (!isPasswordMatching) {
      throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST);
    }
  }
}
