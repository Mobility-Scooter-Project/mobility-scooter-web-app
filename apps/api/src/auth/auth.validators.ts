import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailBodyDto {
    @IsEmail()
    email: string;
}

export class SignInWithEmailDto extends EmailBodyDto {
    @IsNotEmpty()
    password: string;
}

export class TokenDto {
    @IsNotEmpty()
    token: string;
}

