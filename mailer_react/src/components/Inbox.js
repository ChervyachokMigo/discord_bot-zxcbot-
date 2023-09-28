
import { useState, useEffect, useContext } from 'react'
import Addressee from './Addressee';
import { isAuthedContext, TokenContext } from './Contexts';
import Logout from './Logout';

export default function Inbox (){
    const [addressees, setAddressees] = useState([]);
    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {token, setToken} = useContext(TokenContext);

    useEffect(() => {
        if (token && is_authed){
            fetch([
                'https://api.svdgod.ru/query?action=inbox',
                'token='+token
            ].join('&')).then(response => response.json())
                .then(data => {
                    if (data.error){
                        console.log(data.error);
                        setAuth(false);
                        setToken('');
                        setAddressees([]);
                        return;
                    }
                    setAddressees(data.inbox);
                })
                .catch(error => console.log(error));
        }
    }, [token, is_authed, setAuth, setToken, setAddressees]);

    if (is_authed){
        if ( addressees && addressees.length > 0 ){
            return (<div className='inbox-panel'>
                <div className='actions'>
                    <div className='inboxTitle'>Inbox</div>
                    <Logout /></div>
                <div className='inbox'>
                    { addressees.map( (name) => {return <Addressee key={name} className='addressee' name={name} />} )}
                </div>
            </div>)
        } else {
            return (<div>&lt; Пусто &gt;</div>);
        }
    } else {
        return (<div className='emptyDiv'></div>)
    }

}
