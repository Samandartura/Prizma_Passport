import { IsEmail } from 'class-validator';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto, LoginDto, UpdateAuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User } from '@prisma/client';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaServise:PrismaService,
    private readonly jwtServise: JwtService,
  ){}

    // generate token
    async generateToken(userId:number,email:string):Promise<Tokens>{
      const jwtPayload:JwtPayload = {
        sub:userId,
        email:email
      };
  
      const [accessToken,refreshToken] = await Promise.all([
        this.jwtServise.signAsync(jwtPayload,{
          secret:process.env.ACCESS_TOKEN_KEY,
          expiresIn:process.env.ACCESS_TOKEN_TIME,
        }),
        this.jwtServise.signAsync(jwtPayload,{
          secret:process.env.REFRESH_TOKEN_KEY,
          expiresIn:process.env.REFRESH_TOKEN_TIME
        }),
      ]);
  
      const response = {
        access_token:accessToken,
        refresh_token:refreshToken
      };
      return response;
    }

  // update Refresh Token ===================
  async updateRefreshToken(userId:number, refreshToken:string){
    const hashedRefreshToken = await bcrypt.hash(refreshToken,7)
    await this.prismaServise.user.update({
      where:{
        id:userId
      },
      data:{
        hashedRefreshToken,
      }
    })
  }

  // singup ==============
  async signup(createAuthDto:CreateAuthDto,res: Response):Promise<Tokens>{
    const condidate = await this.prismaServise.user.findUnique({
      where: {
        email:createAuthDto.email
      },
    });
    if(condidate){
      throw new BadRequestException('User already exists!')
    }

    const hashedPassword = await bcrypt.hash(createAuthDto.password,7)

    const newUser = await this.prismaServise.user.create({
      data:{
        name: createAuthDto.name,
        email:createAuthDto.email,
        hashedPassword
      }
    });

    const tokens = await this.generateToken(newUser.id,newUser.email)
    await this.updateRefreshToken(newUser.id,tokens.refresh_token)

    res.cookie('refresh_token', tokens.refresh_token,{
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly:true,
    });

    return tokens;
  }

  // signin ==============
  // async signin(loginDto:LoginDto,res:Response){
  //   const {email,password} = loginDto;

  //   const user = await this.prismaServise.user.findUnique({
  //     where:{email:loginDto.email}
  //   })
  //   if(!user){
  //     throw new ForbiddenException("Bunday foydalanuvchi ruyxatdan utmagan")
  //   }

  //   const passwordMatches = await bcrypt.compare(password,user.hashedPassword);
  //   if(!passwordMatches) throw new ForbiddenException('Acces Denied');

  //   const tokens = await this.getTokens(user.id,user.email);
  //   await this.updateRefreshToken(user.id,tokens.refresh_token);
  //   res.cookie('refresh_token',tokens.refresh_token,{
  //     maxAge:7*24*60*60*1000,
  //     httpOnly:true
  //   })
  //   return tokens
  // }
  // getTokens(id: number, email: string) {
  //   throw new Error('Method not implemented.');
  // }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
