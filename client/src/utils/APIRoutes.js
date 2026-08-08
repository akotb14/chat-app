export const host = process.env.HOST || "http://localhost:3000";
export const register = `${host}/api/register`;
export const login = `${host}/api/login`;
export const getUser = `${host}/api/getUser`;
export const getUsers = `${host}/api/getUsers`;
export const postMessage = `${host}/api/postMessage`;
export const getMessages = `${host}/api/getMessages`;
export const logout = `${host}/api/logout`;