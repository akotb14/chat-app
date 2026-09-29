// Set REACT_APP_API_HOST in client/.env to point at a deployed server. Only
// REACT_APP_-prefixed variables reach the browser bundle, so this must not be
// renamed back to a bare HOST.
export const host = process.env.REACT_APP_API_HOST || "https://chat-app-ten-theta-ijn1kxofp7.vercel.app";
export const register = `${host}api/register`;
export const login = `${host}api/login`;
export const getUser = `${host}api/getUser`;
export const getUsers = `${host}api/getUsers`;
export const postMessage = `${host}api/postMessage`;
export const getMessages = `${host}api/getMessages`;
export const logout = `${host}api/logout`;