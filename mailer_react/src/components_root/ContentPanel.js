
import { useContext } from "react";
import { hoverElementContext } from "./RootContexts";
import ExtraPanel from "./ExtraPanel";
import AliasesPanel from "./AliasesPanel";
import ServicesPanel from "./ServicesPanel"

export default function ContentPanel ({selectedHeader}) {
    const {hoveredElement} = useContext(hoverElementContext);

    var data = {};
    switch (selectedHeader) {
        case 'aliases':
            data = {
                title: "SADGOD", 
                title_desc: "Псевдонимы",
                Panel: <AliasesPanel />
            };
            break;
        case 'extra':
            data = {
                title: "SADGOD", 
                title_desc: "Дополнительные ссылки",
                Panel: <ExtraPanel /> 
            };
            break;
        case 'home':
            data = {
                title: "SADGOD", 
                title_desc: "ОфИЦИАЛЬНЫЙ САЙТ",
                Panel: <ServicesPanel />
            };
        break;
    }

    return (
        <div className="root_content">
            <div className="root_title">
                <div className="root_title_name">{data.title}</div>
                <div className="root_title_desc">{data.title_desc}</div>
            </div>
            {data.Panel}
            <div className="root_selected_link" id="root_selected_link">
                {hoveredElement}
            </div>
        </div>
    );

}
