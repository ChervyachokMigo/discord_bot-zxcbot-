
import { useState, useEffect, useContext } from 'react'
import { PostContentContext, isAuthedContext, TokenContext, SelectedPostContext, QueryContext } from './MailContexts';

export default function Post (props) {

    const [isOpened, setOpened] = useState(false);

    const {setContent} = useContext(PostContentContext);
    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {token, setToken} = useContext(TokenContext);
    const {selectedPost, setSelectedPost} = useContext(SelectedPostContext)
    const {query} = useContext(QueryContext);

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
        if (!props.args.unique_key){
            console.log('not props.unique_key');
        }
        if (token && is_authed && isOpened && props.args.unique_key ){
            fetch([
                'https://api.svdgod.ru/query?action=post_content', 
                'unique_key=' + props.args.unique_key, 
                'token=' + token
            ].join('&')).then(response => response.json())
            .then(data => {
                if (data.error){
                    console.log(data.error);
                    setAuth(false);
                    setToken('');
                    setContent({});
                    return;
                }
                setContent(data.post);
            })
            .catch(error => console.log(error));
        } else {
            setContent({});
        }
    }, [isOpened, token, is_authed, setAuth, setToken, setContent, props.args.unique_key])

    const openPost = (e) =>{
        setSelectedPost(props.args.unique_key);
    }

    useEffect( ()=> {
        if (props.args.unique_key && selectedPost){
            if (props.args.unique_key.includes(selectedPost)){
                setOpened( true );
            } else {
                setOpened( false );
            }
        }
    }, [selectedPost, props.args.from, setSelectedPost, props.args.unique_key, props.args.subject])

    useEffect( () => {
        if (props.args.unique_key === query.post_key){
            openPost();
        }
    }, [query, props.args.unique_key])

    return (
        <div className={isOpened? 'PostOpen' : 'PostClose'} 
            onClick={ openPost }>
                {props.args.from}: <br></br>{props.args.subject}<br></br>{props.args.date.replace(/T/, ' ').replace(/\..+/, '')}
        </div>)

}
