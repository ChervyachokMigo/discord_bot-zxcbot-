
import { useContext, useEffect } from "react";
import ServicesPanel from "./components_root/ServicesPanel"
import { hoverElementContext, headerSelectedContext } from "./components_root/RootContexts";
import RootHeader from "./components_root/RootHeader";
import ExtraPanel from "./components_root/ExtraPanel";
import AliasesPanel from "./components_root/AliasesPanel";

export default function AppRoot () {
    const {selectedHeader} = useContext(headerSelectedContext);
    const {hoveredElement} = useContext(hoverElementContext);
    
    const home = () => { return (
        <div className="root_content">
            <ServicesPanel />
            <div className="root_selected_link" id="root_selected_link">
                {hoveredElement}
            </div>
        </div>
    )};

    const extra = () => { return (
        <div className="root_content">
            <ExtraPanel />
            <div className="root_selected_link" id="root_selected_link">
                {hoveredElement}
            </div>
        </div>
    )};

    const aliases = () => { return (
        <div className="root_content">
            <AliasesPanel />
            <div className="root_selected_link" id="root_selected_link">
                {hoveredElement}
            </div>
        </div>
    )};

    useEffect ( ()=> {

    }, [selectedHeader])

    let particles = [];

    for (let i=0; i< 90; i++) {
        particles.push(<div className="background_particle"></div>)
    };
    

    return (
        <div className='root_page'>
            <div className="particles">{particles.map( p=> p)}</div>
            
            <RootHeader />
            <div className='body_root'>
                { selectedHeader === 'home'? home(): <></>}
                { selectedHeader === 'extra'? extra():  <></>}
                { selectedHeader === 'aliases'? aliases():  <></>}
            </div>
        </div>
    )
    
}
