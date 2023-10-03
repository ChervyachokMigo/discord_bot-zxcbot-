import { useContext } from 'react';
import { hoverElementContext } from './RootContexts';

export default function ServiceIcon ({data}) {

    const { setHoveredElement} = useContext(hoverElementContext);

    return (<div className='service_icon'  >
        <a href={data.url}><img src={data.img} alt='' 
        onPointerEnter={ () => setHoveredElement(data.name)}
        onPointerLeave={ () => setHoveredElement('')}
        ></img></a>
    </div>)

}
