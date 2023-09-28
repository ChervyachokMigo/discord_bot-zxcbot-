
import { useContext, useEffect, useState } from 'react'
import { PostContentContext, isAuthedContext, SelectedPostContext, TokenContext } from './Contexts';
import parse from 'html-react-parser';


export default function PostContent () {

    const [ content_text, setContentText ] = useState('');

    const { content } = useContext(PostContentContext);
    const { selectedPost, setSelectedPost } = useContext(SelectedPostContext);
    const {token, setToken} = useContext(TokenContext);
    const {is_authed, setAuth} = useContext(isAuthedContext);
    const {setContent} = useContext(PostContentContext);

    const sendDelete = () => {
        console.log('send delete', selectedPost)
        fetch([
            'https://api.svdgod.ru/query?action=post_delete', 
            'unique_key=' + selectedPost, 
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
            setContent({});
            setSelectedPost({});

        })
        .catch(error => console.log(error));
    }

    const sanitize = (raw)=> {
        return raw.replace(/<!--[\s\S]*?--!?>/gm, '')
        .replace(/\s?<head[^>]*?>.*?<\/head>\s?/gm, '')
        .replace(/\s?<html[^>]*?>\s?/gm, '')
        .replace(/\s?<!DOCTYPE[^>]*?>\s?/gm, '')
        .replace(/\s?<\/html[^>]*?>\s?/gm, '')
        .replace('ahref', 'a href')
    }

    const changeContent = (type) => {
        let new_content = parse(sanitize(content[type]), {trim: true});
        setContentText(new_content);
    }

    useEffect( () => {
        setContentText(content['html']?  parse(sanitize(content['html'])): content['text']);
    }, [ content, is_authed])

    if (is_authed && content_text) {
        return (
            <div className='post_area'>
                <div className='post_controls'>
                    <button name="delete_post" onClick={ () => sendDelete()}>Delete</button>
                    <button name="text" onClick={ () => changeContent('text')}>Text</button>
                    <button name="html" onClick={ () => changeContent('html')}>Html</button>
                    <button name="textashtml" onClick={ () => changeContent('textAsHtml')}>Text As Html</button>
                </div>
            <div className={content_text ? 'post_content' : 'post_content_hidden'}>
                {content_text}
            </div>
            </div>
        )
    } else {
        return (<div className='emptyDiv'></div>)
    }

}
