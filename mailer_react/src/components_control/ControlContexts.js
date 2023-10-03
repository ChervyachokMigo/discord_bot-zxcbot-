
import { createContext,  useState } from 'react'

const isAuthedContext = createContext( null );
const TokenContext = createContext( null );

function AuthedProvider({children}) {
  const [is_authed, setAuth] = useState(false);
  const value = {is_authed, setAuth};
  return (<isAuthedContext.Provider value={value}>{children}</isAuthedContext.Provider>);
}

function TokenProvider({children}) {
  const [token, setToken] = useState('');
  const value = {token, setToken};
  return (<TokenContext.Provider value={value}>{children}</TokenContext.Provider>);
}

export {  isAuthedContext,  TokenContext, 
          AuthedProvider,  TokenProvider, 
        }