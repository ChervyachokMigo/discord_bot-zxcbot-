
import {useEffect, useContext } from 'react'

import Auth from './components_mail/Auth'
import Inbox from './components_mail/Inbox'
import PostContent from './components_mail/PostContent'
import { isAuthedContext, PostContextProvider, QueryContext, SelectedPostProvider, TokenContext } from './components_mail/MailContexts'

export default function Mail () {

    const {setAuth} = useContext(isAuthedContext);
    const {setToken} = useContext(TokenContext);
    const {setQuery} = useContext(QueryContext);

    useEffect(() => {
        const url_query = new URLSearchParams(window.location.search);
        if (url_query.size>0){
            const action = url_query.get('action');
            if (action && action === 'new_message'){
                const post_key = url_query.get('post_key');
                const addressee = url_query.get('addressee');
                if (post_key && addressee){
                    setQuery({post_key, addressee});
                }
            }
        }
    }, [setQuery]);

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
