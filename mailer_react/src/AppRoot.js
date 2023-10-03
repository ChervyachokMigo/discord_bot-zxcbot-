
import { useContext } from "react";

import { headerSelectedContext } from "./components_root/RootContexts";
import RootHeader from "./components_root/RootHeader";

import ContentPanel from "./components_root/ContentPanel";

import Particles from "./components_root/Particles";

export default function AppRoot () {
    const {selectedHeader} = useContext(headerSelectedContext);

    return (
        <div className='root_page'>
            <Particles size="90" />
            
            <RootHeader />

            <div className='body_root'>
                <ContentPanel selectedHeader={selectedHeader} />
            </div>
        </div>
    )
    
}
