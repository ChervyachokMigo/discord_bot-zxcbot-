import { useContext } from 'react';
import { hoverElementContext } from './RootContexts';
export default function ServiceIcon ({data}) {

    const { setHoveredElement} = useContext(hoverElementContext);

    return (
        <div className='alias_text'
        onPointerEnter={ () => setHoveredElement(data.text)}
        onPointerLeave={ () => setHoveredElement('')}>
            {data.text}
        </div>
    )

}
