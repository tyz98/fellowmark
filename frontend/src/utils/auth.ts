import jwtDecode from "jwt-decode";
import { Dispatch } from "react";
import { ContextState } from "../context/context";
import { Role } from "../pages/Login";
import { AuthType } from "../reducers/reducer";

interface Claims {
  role: Role;
  data: any;
  exp: any;
}

export function authenticate(dispatch: Dispatch<ContextState>) {
  const token = (localStorage.FBIdToken as string);
  if (token) {
    const claims: Claims = jwtDecode(token);
    if (claims.exp * 1000 > Date.now()) {
      const secondsLeft = claims.exp * 1000 - Date.now();
      console.log(secondsLeft);
      setTimeout(() => { alert("Session expired"); }, secondsLeft - 30);
      setUserContext(claims, dispatch);
      return true;
    }
  }
  return false;
}

export function setUserContext(
  claims: Claims,
  dispatch: Dispatch<ContextState>
) {
  const context: ContextState = {
    type: AuthType.AUTHENTICATED,
    payload: {
      user: claims.data,
      role: claims.role
    },
  };
  dispatch(context);
}
