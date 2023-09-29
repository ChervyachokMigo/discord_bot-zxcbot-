import { useContext } from 'react';
import { hoverElementContext } from './RootContexts';
export default function ServiceIcon (props) {

    const { setHoveredElement} = useContext(hoverElementContext);

    return (
        <div className='alias_text'
        onPointerEnter={ () => setHoveredElement(props.text)}
        onPointerLeave={ () => setHoveredElement('')}>
            {props.text}
        </div>
    )

}
