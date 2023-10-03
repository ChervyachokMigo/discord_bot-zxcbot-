
import ServiceIcon from './ServiceIcon';
import { data } from '../src/data/root_services_panel_links';

export default function ServicesPanel (props) {

    return (<div className='services_panel'>{data.map ( item => {
        return <ServiceIcon key={item.id} data={item} />
    })}</div>)

}
