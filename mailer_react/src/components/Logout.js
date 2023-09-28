
import { useContext } from 'react'
import { isAuthedContext, TokenContext, PostContentContext } from './Contexts';

export default function Logout (props){

    const { setAuth} = useContext(isAuthedContext);
    const { setToken} = useContext(TokenContext);
    const { setContent} = useContext(PostContentContext);

    const logoutAction = () => {
        fetch('https://api.svdgod.ru/query?action=logout').then(data => {
            setAuth(data.is_authed || false);
            setToken(data.token || '');
            setContent({})
            return;
        }).catch(error => console.log(error));
    }

    return (
        <div className='Logout' onClick={ logoutAction }>
            Logout
        </div>
    )

}
