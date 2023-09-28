
import { createContext,  useState } from 'react'

const isAuthedContext = createContext( null );
const PostContentContext = createContext( null );
const TokenContext = createContext( null );
const SelectedPostContext = createContext( null );

function AuthedProvider({children}) {
  const [is_authed, setAuth] = useState(false);
  const value = {is_authed, setAuth};
  return (<isAuthedContext.Provider value={value}>{children}</isAuthedContext.Provider>);
}

function PostContextProvider({children}) {
  const [content, setContent] = useState({});
  const value = {content, setContent};
  return (<PostContentContext.Provider value={value}>{children}</PostContentContext.Provider>);
}

function TokenProvider({children}) {
  const [token, setToken] = useState('');
  const value = {token, setToken};
  return (<TokenContext.Provider value={value}>{children}</TokenContext.Provider>);
}

function SelectedPostProvider({children}) {
  const [selectedPost, setSelectedPost] = useState('');
  const value = {selectedPost, setSelectedPost};
  return (<SelectedPostContext.Provider value={value}>{children}</SelectedPostContext.Provider>);
}

export {  isAuthedContext, PostContentContext, TokenContext, SelectedPostContext,
          AuthedProvider, PostContextProvider, TokenProvider, SelectedPostProvider
        }