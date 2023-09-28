
import { useContext, useState, useEffect } from 'react'
import { isAuthedContext, TokenContext } from './Contexts';

export default function Auth () {

    const {is_authed, setAuth} = useContext(isAuthedContext);
    const [auth_key, setAuthKey] = useState('');
    const {setToken} = useContext(TokenContext);

    const submitKey = () => {
        if (auth_key){
            fetch([
                'https://api.svdgod.ru/query?action=auth_request',
                'auth_key='+auth_key
            ].join('&')).then(response => response.json())
            .then(data => {
                setAuth(data.is_authed);
                setAuthKey('');
                if (data.is_authed === false) {
                    fetch('https://api.svdgod.ru/query?action=get_auth_key')
                    .catch(error => console.log(error));
                } else {
                    if (data.token){
                        setToken(data.token);
                    }
                }
            })
            .catch(error => console.log(error)) 
        }
    }


    useEffect( () => {
        
    }, [auth_key])

    if (is_authed === false){
        return (<div className='authPanel'>
            <label htmlFor="auth_key">Auth</label><input type="text" className='AuthKeyField' name="auth_key" value={auth_key}
            required minLength="6" maxLength="8" placeholder="Enter key" onChange={(e)=>setAuthKey(e.target.value)} />
            <button type="button" className="SubmitAuthKeyButton" onClick={submitKey}>Auth</button>
        </div>)
    }

    if (is_authed === true){
        return (<div className='emptyDiv'></div>);
    }

}