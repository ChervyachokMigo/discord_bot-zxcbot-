import { useContext } from "react"
import { headerSelectedContext } from "./RootContexts";

export default function RootHeader (props) {

    const {selectedHeader, setSelectedHeader} = useContext(headerSelectedContext);

    return (
        <div className={props.name} onClick={ ()=> setSelectedHeader(props.name) }
            style={selectedHeader===props.name?{color:"gray"}:{color:"#fff"}}>
            {props.text}
        </div>
    )

}
