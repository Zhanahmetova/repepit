export interface User {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
}

export interface UserResponse {
    user: User;
    jwt: string;
}

export interface ILogin {
    identifier: string;
    password: string;
}

export interface IRegister {
    username: string;
    email: string;
    password: string;
}   