
export type User = {
    email: string;
    name: string;
    github: string;
    twitter: string;
}

export const users: { [name: string]: User } = {
    "encse": {
        email: 'encse@csokavar.hu',
        name: 'encse',
        github: 'encse',
        twitter: 'encse'
    }
}

export function lookupUser(name: string): User | undefined {
    return users[name];
}