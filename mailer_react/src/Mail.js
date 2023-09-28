
import {useEffect, useContext } from 'react'

import Auth from './components/Auth'
import Inbox from './components/Inbox'
import PostContent from './components/PostContent'
import { isAuthedContext, PostContextProvider, SelectedPostProvider, TokenContext } from './components/Contexts'

export default function Mail () {

    const {setAuth} = useContext(isAuthedContext);
    const {setToken} = useContext(TokenContext);


    useEffect(() => {

        fetch('https://api.svdgod.ru/query?action=is_authed')
            .then(response => response.json())
            .then(data => {
                setAuth(data.is_authed);
                if (data.is_authed && data.token) {
                    setToken(data.token);
                } else {
                    fetch('https://api.svdgod.ru/query?action=get_auth_key')
                    .catch(error => console.log(error));
                }
            })
            .catch(error => console.log(error));
    }, [setAuth, setToken]);

    return (<div className='mailer_root'>
        <header>Welcome to Mail</header>
        <main>
            <Auth />
            
            <PostContextProvider>
                <SelectedPostProvider>
                    <Inbox />
                    <PostContent />
                </SelectedPostProvider>
            </PostContextProvider>
            
            
        </main>
    </div>)
    
}
