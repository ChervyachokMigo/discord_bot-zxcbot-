
import ServiceIcon from './ServiceIcon';
import { data } from '../src/data/extra_services_panel_links.js';

export default function ExtraPanel (props) {
    
    return (<div className='extra_panel'>{data.map ( item => {
        return <ServiceIcon key={item.id} data={item} />
    })}</div>)

}
