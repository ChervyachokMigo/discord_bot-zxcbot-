
import AliaseName from './AliaseName';
import { data } from '../src/data/aliases_panel_data.js';

export default function AliasesPanel (props) {

    return (<div className='aliases_panel'>{data.map ( alias => {
        return <AliaseName key={alias.id} data={alias} />
    })}</div>)

}
