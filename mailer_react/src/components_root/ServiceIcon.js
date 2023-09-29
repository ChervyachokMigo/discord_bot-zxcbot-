import { useContext } from 'react';
import { hoverElementContext } from './RootContexts';
export default function ServiceIcon (props) {

    const { setHoveredElement} = useContext(hoverElementContext);

    return (<div className='service_icon'  >
        <a href={props.url}><img src={props.img} alt='' 
        onPointerEnter={ () => setHoveredElement(props.name)}
        onPointerLeave={ () => setHoveredElement('')}
        ></img></a>
    </div>)

}
