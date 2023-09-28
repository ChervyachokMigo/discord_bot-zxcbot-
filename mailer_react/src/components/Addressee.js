
import { useState, useEffect, useContext } from 'react'
import Post from './Post';
import { TokenContext, isAuthedContext } from './Contexts';

export default function Addressee (props) {
    const [isOpened, toggleAddressee] = useState(false);
    const [posts, setPosts] = useState([]);
    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {token, setToken} = useContext(TokenContext);

    const openAddressee = () =>{
        const notIsOpened = !isOpened;
        toggleAddressee( notIsOpened );
    }

    useEffect( () => {
        if (!token){
            console.log('not token');
        }
        if (!is_authed){
            console.log('not is_authed');
        }
        if (!isOpened){
            console.log('not isOpened');
        }
        if (!props.name){
            console.log('not props.name');
        }
        if (token && is_authed && isOpened && props.name){
            fetch([
                'https://api.svdgod.ru/query?action=post_headers',
                'addressee=' + props.name,
                'token=' + token
            ].join('&')).then(response => response.json())
            .then(data => {
                if (data.error){
                    console.log(data.error);
                    setAuth(false);
                    setToken('');
                    setPosts([]);
                    return;
                }
                setPosts(data.posts);
            })
            .catch(error => console.log(error));
        }
    }, [isOpened, token, is_authed, setAuth, setToken, setPosts, props.name])

    return (<div>
        <div className={isOpened?'AddresseeOpen':'AddresseeClose'} onClick={ () => openAddressee() }>{props.name}</div>
            { isOpened && 
            ( posts ? posts.length > 0 ?
            posts.map( postProps => <Post key={postProps.unique_key} className='post' args={postProps} />) : 
            <div>&lt; Пусто &gt;</div> :
        <div></div> )}
    </div>)

}
