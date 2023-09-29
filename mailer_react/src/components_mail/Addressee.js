
import { useState, useEffect, useContext } from 'react'
import Post from './Post';
import { TokenContext, isAuthedContext, QueryContext, SelectedPostContext } from './MailContexts';

export default function Addressee (props) {
    const [isOpened, toggleAddressee] = useState(false);
    const [posts, setPosts] = useState([]);
    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {token, setToken} = useContext(TokenContext);
    const {query} = useContext(QueryContext);
    const {selectedPost} = useContext(SelectedPostContext)

    const send_request = () => {
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

    useEffect( () => {
        if (token && is_authed && isOpened && props.name){
            send_request();
        }
    }, [isOpened, token, is_authed, setAuth, setToken, setPosts, props.name, selectedPost])

    

    useEffect( () => {
        if (props.name === query.addressee){
            toggleAddressee( !isOpened);
        }
    }, [query, props.name, selectedPost])

    return (<div>
        <div className={isOpened?'AddresseeOpen':'AddresseeClose'} onClick={ () => toggleAddressee( !isOpened) }>{props.name}</div>
            { isOpened && 
            ( posts ? posts.length > 0 ?
            posts.map( postProps => <Post key={postProps.unique_key} className='post' args={postProps} />) : 
            <div>&lt; Пусто &gt;</div> :
        <div></div> )}
    </div>)

}
